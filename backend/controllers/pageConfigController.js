import PageConfig from "../models/PageConfig.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import { LEGACY_TENANT_SLUG } from "../utils/tenantDefaults.js";
import { HOME_PAGE_DEFAULT } from "../utils/pageBuilderDefaults.js";

const normalizeSections = (sections = []) =>
  [...sections]
    .filter((section) => section && section.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

const createEmptyPageConfig = (req, pageType) => ({
  pageType,
  slug: pageType === "home" ? "/" : `/${pageType}`,
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

      return res.status(200).json(page);
    }

    const payload = {
      pageType,
      slug: req.body.slug || (pageType === "home" ? "/" : `/${pageType}`),
      title: req.body.title || "",
      status: req.body.status || "published",
      seo: req.body.seo || {},
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

    res.status(200).json(page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
