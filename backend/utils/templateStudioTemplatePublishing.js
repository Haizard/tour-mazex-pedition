import { normalizeTemplateId } from "./platformTemplateRegistry.js";

const normalizeList = (value = []) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item));
  }

  return String(value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const studioSectionToPageSection = (section = {}, index = 0) => ({
  type: section.type || "customHtml",
  variant: section.variant || "default",
  order: section.order || index + 1,
  enabled: section.enabled !== false,
  dataConfig: { ...(section.dataConfig || {}) },
  contentConfig: { ...(section.content || section.contentConfig || {}) },
  styleConfig: {
    ...(section.styles || section.styleConfig || {}),
    customCss: section.customCss || section.styles?.customCss || section.styleConfig?.customCss || "",
  },
  sourceType: section.sourceType || "manual",
  sourceMeta: { ...(section.sourceMeta || {}) },
  bindings: [...(section.bindings || [])],
  responsive: { ...(section.responsive || {}) },
  visibility: { ...(section.visibility || {}) },
  label: section.label || "",
});

export const buildReusableSectionTemplatePayload = ({
  section = {},
  name = "",
  category = "Reusable Section",
  previewImage = "",
} = {}) => ({
  id: normalizeTemplateId(name || section.label || section.type || "reusable-section"),
  name: name || section.label || "Reusable Section",
  category,
  previewImage,
  section: {
    ...section,
    bindings: [...(section.bindings || [])],
  },
  supportedBindings: [...new Set((section.bindings || []).map((binding) => binding.sourceKey).filter(Boolean))],
  sourceType: section.sourceType || "manual",
});

export const buildStudioTemplatePayload = ({
  studioPage = {},
  templateMeta = {},
} = {}) => ({
  id: normalizeTemplateId(templateMeta.id || templateMeta.name || studioPage.title || "template"),
  name: templateMeta.name || studioPage.title || "Template",
  category: templateMeta.category || "Tourism Website",
  pageType: studioPage.pageType || "home",
  priceLabel: templateMeta.priceLabel || "$149",
  purchaseStatus: templateMeta.purchaseStatus || "available",
  status: templateMeta.status || "published",
  previewImage: templateMeta.previewImage || "",
  preview:
    templateMeta.preview ||
    "A Template Studio page imported and prepared for platform reuse.",
  bestFor: normalizeList(templateMeta.bestFor || []),
  featuredRank: Number(templateMeta.featuredRank ?? 50),
  releaseOrder: Number(templateMeta.releaseOrder ?? Date.now()),
  seo: { ...(studioPage.seo || {}) },
  themeTokens: { ...(studioPage.themeTokens || {}) },
  templateSource: { ...(studioPage.templateSource || {}) },
  sections: (studioPage.sections || []).map((section, index) => studioSectionToPageSection(section, index)),
});

