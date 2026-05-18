import crypto from "node:crypto";

import {
  buildImportedSectionFromSource,
  extractCssFromSource,
  sanitizeImportedHtml,
} from "./pageBuilderSourceImport.js";
import { suggestBindingsForSection } from "./templateStudioBindingSuggestions.js";
import { normalizeTemplateStudioSection } from "./templateStudioSectionModel.js";

const fallbackNormalizeSection = (section = {}, overrides = {}) =>
  normalizeTemplateStudioSection(
    {
      id:
        overrides.id ||
        section.id ||
        `section_${crypto.createHash("sha1").update(JSON.stringify(section)).digest("hex").slice(0, 10)}`,
      type: section.type || "customHtml",
      label:
        overrides.label ||
        section.label ||
        section.content?.title ||
        section.contentConfig?.title ||
        "Section",
      sourceType: overrides.sourceType || section.sourceType || "imported",
      sourceMeta: {
        ...(section.sourceMeta || {}),
        ...(overrides.sourceMeta || {}),
      },
      order: overrides.order || section.order || 1,
      enabled: section.enabled !== false,
      content: { ...(section.content || section.contentConfig || {}) },
      styles: { ...(section.styles || section.styleConfig || {}) },
      bindings: [...(section.bindings || [])],
      responsive: { ...(section.responsive || {}) },
      visibility: { ...(section.visibility || {}) },
      customCss: section.customCss || section.styleConfig?.customCss || "",
    },
    (overrides.order || section.order || 1) - 1
  );

const inferTypeFromBlock = (html = "") => {
  const text = String(html || "").toLowerCase();

  if (text.includes("testimonial") || text.includes("review")) return "reviewWall";
  if (text.includes("faq") || text.includes("question")) return "faq";
  if (text.includes("contact") || text.includes("specialist")) return "contact";
  if (text.includes("tour") || text.includes("package") || text.includes("itinerary")) return "featuredPackages";
  if (text.includes("gallery") || text.includes("photo")) return "gallery";
  if (text.includes("<h1") || text.includes("hero")) return "hero";
  return "customHtml";
};

const splitIntoBlocks = (safeHtml = "") => {
  const sectionMatches = [...String(safeHtml).matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/gi)].map(
    (match) => match[0]
  );

  if (sectionMatches.length) {
    return sectionMatches;
  }

  const articleMatches = [...String(safeHtml).matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/gi)].map(
    (match) => match[0]
  );

  if (articleMatches.length) {
    return articleMatches;
  }

  return safeHtml.trim() ? [safeHtml] : [];
};

const buildImportJobId = (seed = "") =>
  `import_${crypto.createHash("sha1").update(seed).digest("hex").slice(0, 12)}`;

export const createTemplateStudioImportDraft = ({
  sourceType = "html-css-page",
  sourceCode = "",
  name = "Imported Template",
  referenceImageUrl = "",
} = {}) => {
  const safeHtml = sanitizeImportedHtml(sourceCode);
  const sectionSources =
    sourceType === "html-snippet" ? [safeHtml] : splitIntoBlocks(safeHtml);
  const rawSectionDrafts = sectionSources.map((block, index) => {
    const imported = buildImportedSectionFromSource({
      sourceCode: `${block}\n<style>${extractCssFromSource(sourceCode)}</style>`,
      name: sectionSources.length > 1 ? `${name} ${index + 1}` : name,
    });

    return {
      ...imported,
      type: inferTypeFromBlock(block),
      order: index + 1,
      contentConfig: {
        ...(imported.contentConfig || {}),
        sourceSnippet: block,
      },
    };
  });

  const importJobId = buildImportJobId(`${sourceType}:${name}:${sourceCode}:${referenceImageUrl}`);
  const warnings = [];
  const unsupportedFragments = [];

  if (/<script\b/i.test(sourceCode)) {
    unsupportedFragments.push("Script tags were removed during import.");
  }

  if (!sectionSources.length) {
    warnings.push("No clear sections were detected; the import was converted into a single editable block.");
  }

  const sectionDrafts = rawSectionDrafts.map((section, index) => {
    const normalized = fallbackNormalizeSection(section, {
      id: `${importJobId}_section_${index + 1}`,
      label: sectionSources.length > 1 ? `${name} Section ${index + 1}` : name,
      order: index + 1,
      sourceMeta: {
        importJobId,
        sourceType,
      },
    });

    normalized.bindings = suggestBindingsForSection(normalized);
    return normalized;
  });

  return {
    importJob: {
      id: importJobId,
      name,
      sourceType,
      status: "analyzed",
      previewImage: referenceImageUrl,
      warningCount: warnings.length,
    },
    pageDraft: {
      id: `${importJobId}_page`,
      name,
      pageType: "landing",
      slug: "/landing",
      sections: sectionDrafts,
      sourceSummary: {
        sourceType,
        importJobId,
      },
    },
    sectionDrafts,
    assets: {
      stylesheets: extractCssFromSource(sourceCode) ? [extractCssFromSource(sourceCode)] : [],
      media: [],
    },
    warnings,
    unsupportedFragments,
  };
};
