const DEFAULT_PREVIEW_IMAGE =
  "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80";

export const normalizeTemplateId = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeList = (value = []) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseSections = (payload = {}) => {
  const rawSections = payload.sectionsJson || payload.sections || [];
  const sections =
    typeof rawSections === "string" ? JSON.parse(rawSections || "[]") : rawSections;

  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error("At least one page-builder section is required.");
  }

  return sections
    .filter((section) => section && section.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((section, index) => ({
      ...section,
      order: index + 1,
      enabled: section.enabled !== false,
      dataConfig: section.dataConfig || {},
      contentConfig: section.contentConfig || {},
      styleConfig: section.styleConfig || {},
    }));
};

export const normalizePlatformTemplatePayload = (payload = {}) => {
  const name = payload.name?.toString().trim();
  const id = normalizeTemplateId(payload.id || name);
  const sections = parseSections(payload);

  if (!name) {
    throw new Error("Template name is required.");
  }

  if (!id) {
    throw new Error("Template id is required.");
  }

  return {
    id,
    name,
    category: payload.category?.toString().trim() || "Tourism Website",
    pageType: payload.pageType?.toString().trim() || "home",
    priceLabel: payload.priceLabel?.toString().trim() || "$149",
    purchaseStatus: ["available", "included", "purchased"].includes(payload.purchaseStatus)
      ? payload.purchaseStatus
      : "available",
    status: payload.status === "draft" ? "draft" : "published",
    previewImage: payload.previewImage?.toString().trim() || DEFAULT_PREVIEW_IMAGE,
    preview:
      payload.preview?.toString().trim() ||
      "A platform-created tourism website template ready for the page builder.",
    bestFor: normalizeList(payload.bestFor),
    featuredRank: Number(payload.featuredRank ?? 50),
    releaseOrder: Number(payload.releaseOrder ?? Date.now()),
    seo: {
      title: payload.seo?.title?.toString().trim() || `${name} Template`,
      description: payload.seo?.description?.toString().trim() || "",
      keywords: normalizeList(payload.seo?.keywords || payload.keywords),
    },
    templateSource: payload.templateSource && typeof payload.templateSource === "object"
      ? payload.templateSource
      : {},
    marketplaceVisibility:
      payload.marketplaceVisibility === "hidden" ||
      payload.marketplaceVisibility === "platform-only"
        ? payload.marketplaceVisibility
        : "marketplace",
    assignmentRules:
      payload.assignmentRules && typeof payload.assignmentRules === "object"
        ? payload.assignmentRules
        : {},
    themeTokens:
      payload.themeTokens && typeof payload.themeTokens === "object"
        ? payload.themeTokens
        : {},
    sections,
  };
};

export const serializePlatformTemplate = (template = {}) => {
  const raw = template.toObject ? template.toObject() : template;

  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    pageType: raw.pageType,
    priceLabel: raw.priceLabel,
    purchaseStatus: raw.purchaseStatus,
    status: raw.status || "published",
    previewImage: raw.previewImage || DEFAULT_PREVIEW_IMAGE,
    preview: raw.preview,
    bestFor: raw.bestFor || [],
    featuredRank: raw.featuredRank || 50,
    releaseOrder: raw.releaseOrder || 100,
    seo: raw.seo || {},
    templateSource: raw.templateSource || {},
    marketplaceVisibility: raw.marketplaceVisibility || "marketplace",
    assignmentRules: raw.assignmentRules || {},
    themeTokens: raw.themeTokens || {},
    sections: raw.sections || [],
    source: "platform",
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
};

export const mergeTemplateCatalog = (builtInTemplates = [], platformTemplates = []) => {
  const merged = new Map();

  builtInTemplates.forEach((template) => {
    merged.set(template.id, template);
  });
  platformTemplates.forEach((template) => {
    merged.set(template.id, template);
  });

  return Array.from(merged.values());
};
