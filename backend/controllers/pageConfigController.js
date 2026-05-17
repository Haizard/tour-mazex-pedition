import process from "node:process";
import PageConfig from "../models/PageConfig.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import { LEGACY_TENANT_SLUG } from "../utils/tenantDefaults.js";
import { HOME_PAGE_DEFAULT } from "../utils/pageBuilderDefaults.js";
import {
  buildAiVariantPrompt,
  buildClassicDesignVariants,
  parseAiVariantResponse,
} from "../utils/pageBuilderAiVariants.js";
import { buildImportedSectionFromSource } from "../utils/pageBuilderSourceImport.js";
import { buildTemplatePageConfigPayload } from "../utils/pageBuilderTemplateApplication.js";
import {
  getDefaultPageSlug,
  isPagePubliclyAccessible,
  normalizePageSlug,
} from "../utils/pagePublishing.js";
import { syncAssistantKnowledgeEmbedding } from "../utils/pgvectorRetrieval.js";

const normalizeSections = (sections = []) =>
  [...sections]
    .filter((section) => section && section.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

const createEmptyPageConfig = (req, pageType) => ({
  pageType,
  slug: getDefaultPageSlug(pageType),
  title: pageType === "home" ? "Home" : pageType,
  status: "published",
  seo: {},
  sections: [],
  tenantId: req.tenantId,
});

const mergeContentOnlySections = (currentSections = [], incomingSections = []) => {
  const incomingById = new Map(
    incomingSections
      .filter((section) => section?._id)
      .map((section) => [String(section._id), section])
  );

  return normalizeSections(currentSections).map((section) => {
    const incoming =
      incomingById.get(String(section._id || "")) ||
      incomingSections.find(
        (candidate) =>
          candidate?.type === section.type && Number(candidate?.order) === Number(section.order)
      ) ||
      {};

    return {
      ...section,
      contentConfig: {
        ...(section.contentConfig || {}),
        ...(incoming.contentConfig || {}),
      },
    };
  });
};

const isLegacyDefaultHomePage = (page) => {
  const sections = normalizeSections(page?.sections || []);
  const defaultSections = normalizeSections(HOME_PAGE_DEFAULT.sections || []);

  return (
    page?.pageType === "home" &&
    sections.length === defaultSections.length &&
    sections.every((section, index) => section.type === defaultSections[index]?.type) &&
    sections[0]?.contentConfig?.eyebrow === HOME_PAGE_DEFAULT.sections[0]?.contentConfig?.eyebrow
  );
};

const syncPageConfigKnowledgeEmbedding = async (page = {}) => {
  await syncAssistantKnowledgeEmbedding(
    {
      sourceType: "page-config",
      sourceId: page._id,
      tenantId: page.tenantId,
      title: page.title || page.pageType || "Page content",
      body: [
        page.slug,
        page.seo?.title,
        page.seo?.description,
        ...(Array.isArray(page.seo?.keywords) ? page.seo.keywords : []),
        ...(Array.isArray(page.sections)
          ? page.sections.flatMap((section) => [
              section.type,
              section.variant,
              JSON.stringify(section.contentConfig || {}),
            ])
          : []),
      ]
        .filter(Boolean)
        .join(" "),
      metadata: {
        pageType: page.pageType || "",
        slug: page.slug || "",
        status: page.status || "",
      },
    }
  );
};

export const getPageConfig = async (req, res) => {
  try {
    const pageType = req.params.pageType || "home";
    let page = await PageConfig.findOne(buildTenantFilter(req, { pageType })).lean();

    if (
      page &&
      pageType === "home" &&
      req.tenant?.slug !== LEGACY_TENANT_SLUG &&
      isLegacyDefaultHomePage(page)
    ) {
      page = createEmptyPageConfig(req, pageType);
    }

    if (page && !isPagePubliclyAccessible(page, req)) {
      page = null;
    }

    if (!page && pageType === "home" && req.tenant?.slug === LEGACY_TENANT_SLUG) {
      page = {
        ...HOME_PAGE_DEFAULT,
        tenantId: req.tenantId,
      };
    }

    if (!page) {
      page = createEmptyPageConfig(req, pageType);
    }

    page.sections = normalizeSections(page.sections);
    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listPageConfigs = async (req, res) => {
  try {
    const pages = await PageConfig.find(buildTenantFilter(req))
      .sort({ createdAt: 1, title: 1 })
      .select("pageType slug title status updatedAt createdAt")
      .lean();

    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resolvePageConfigBySlug = async (req, res) => {
  try {
    const slug = normalizePageSlug(req.query.slug || "/");
    const query = buildTenantFilter(req, { slug });

    if (!req.admin && !req.platformAdmin) {
      query.status = "published";
    }

    const page = await PageConfig.findOne(query).lean();

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    page.sections = normalizeSections(page.sections);
    return res.status(200).json(page);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const upsertPageConfig = async (req, res) => {
  try {
    const pageType = req.params.pageType || req.body.pageType || "home";
    const currentPage = await PageConfig.findOne(buildTenantFilter(req, { pageType })).lean();
    const canManageStructure = Boolean(req.platformAdmin);

    if (!canManageStructure) {
      if (!currentPage) {
        return res.status(200).json(createEmptyPageConfig(req, pageType));
      }

      const payload = {
        ...currentPage,
        title: req.body.title || currentPage.title || "",
        templateSource: currentPage.templateSource || {},
        seo: {
          ...(currentPage.seo || {}),
          ...(req.body.seo || {}),
        },
        sections: mergeContentOnlySections(currentPage.sections || [], req.body.sections || []),
      };

      const page = await PageConfig.findOneAndUpdate(
        buildTenantFilter(req, { pageType }),
        withTenantId(req, payload),
        {
          new: true,
          runValidators: true,
        }
      );

      await syncPageConfigKnowledgeEmbedding(page.toObject ? page.toObject() : page);

      return res.status(200).json(page);
    }

    const payload = {
      pageType,
      slug: normalizePageSlug(req.body.slug || getDefaultPageSlug(pageType)),
      title: req.body.title || "",
      status: req.body.status || "published",
      seo: req.body.seo || {},
      templateSource: req.body.templateSource || {},
      sections: normalizeSections(req.body.sections || []),
    };

    const page = await PageConfig.findOneAndUpdate(
      buildTenantFilter(req, { pageType }),
      withTenantId(req, payload),
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    await syncPageConfigKnowledgeEmbedding(page.toObject ? page.toObject() : page);

    res.status(200).json(page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const applyPageBuilderTemplate = async (req, res) => {
  try {
    const payload = buildTemplatePageConfigPayload({
      templateId: req.params.templateId || req.body.templateId,
      tenant: req.tenant,
    });

    const page = await PageConfig.findOneAndUpdate(
      buildTenantFilter(req, { pageType: payload.pageType }),
      withTenantId(req, payload),
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    await syncPageConfigKnowledgeEmbedding(page.toObject ? page.toObject() : page);

    res.status(200).json({
      page,
      message: `${payload.templateSource.templateName} applied as a personalized draft.`,
    });
  } catch (error) {
    res.status(error.message?.includes("not purchased") ? 403 : 400).json({
      message: error.message || "Template could not be applied.",
    });
  }
};

const canManagePageBuilderLayout = (req) => Boolean(req.platformAdmin);

const generateAiVariantsWithProvider = async ({ prompt, baseSections }) => {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    return [];
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    });
    const response = await ai.models.generateContent({
      model: process.env.PAGE_BUILDER_AI_MODEL || "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return parseAiVariantResponse({
      rawText: response.text || "",
      baseSections,
    });
  } catch (error) {
    console.warn("Page builder AI variant generation fell back to deterministic variants:", error.message);
    return [];
  }
};

export const generatePageBuilderAiVariants = async (req, res) => {
  try {
    if (!canManagePageBuilderLayout(req)) {
      return res.status(403).json({ message: "Only platform administrators can generate layout variants." });
    }

    const pageType = req.params.pageType || req.body.pageType || "home";
    const pageConfig = req.body.pageConfig || (await PageConfig.findOne(buildTenantFilter(req, { pageType })).lean());

    if (!pageConfig) {
      return res.status(404).json({ message: "Page config not found." });
    }

    const scope = req.body.scope === "page" ? "page" : "section";
    const targetSection =
      req.body.targetSection ||
      (scope === "section" ? normalizeSections(pageConfig.sections || [])[Number(req.body.sectionIndex) || 0] : null);
    const baseSections = normalizeSections(scope === "page" ? pageConfig.sections || [] : [targetSection].filter(Boolean));

    if (!baseSections.length) {
      return res.status(400).json({ message: "Select at least one section before generating variants." });
    }

    const prompt = buildAiVariantPrompt({
      scope,
      customPrompt: req.body.prompt || "",
      pageConfig,
      targetSection,
    });

    const aiVariants = await generateAiVariantsWithProvider({ prompt, baseSections });
    const variants = aiVariants.length
      ? aiVariants
      : buildClassicDesignVariants({ scope, pageConfig, targetSection });

    return res.status(200).json({
      prompt,
      source: aiVariants.length ? "ai" : "deterministic-fallback",
      variants,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const importPageBuilderSource = async (req, res) => {
  try {
    if (!canManagePageBuilderLayout(req)) {
      return res.status(403).json({ message: "Only platform administrators can import layout source code." });
    }

    const sourceCode = req.body.sourceCode?.toString() || "";
    if (!sourceCode.trim()) {
      return res.status(400).json({ message: "HTML/CSS source code is required." });
    }

    const section = buildImportedSectionFromSource({
      sourceCode,
      name: req.body.name || "Imported Section",
    });

    return res.status(200).json({ section });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
