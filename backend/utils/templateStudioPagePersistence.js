import { normalizeTemplateStudioSection } from "./templateStudioSectionModel.js";

const normalizeSections = (sections = []) =>
  [...sections]
    .filter((section) => section?.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((section, index) => ({
      ...section,
      order: index + 1,
    }));

const normalizeStudioSection = (section = {}, index = 0) =>
  normalizeTemplateStudioSection(
    {
      id: section.id || section._id?.toString?.() || `section-${index + 1}`,
      type: section.type || "customHtml",
      label:
        section.label ||
        section.studioMeta?.label ||
        section.content?.title ||
        section.contentConfig?.title ||
        section.type ||
        `Section ${index + 1}`,
      order: section.order || index + 1,
      enabled: section.enabled !== false,
      sourceType: section.studioMeta?.sourceType || section.sourceType || "manual",
      sourceMeta: {
        ...(section.studioMeta?.sourceMeta || {}),
        ...(section.sourceMeta || {}),
      },
      content: { ...(section.content || section.contentConfig || {}) },
      styles: { ...(section.styles || section.styleConfig || {}) },
      bindings: [...(section.studioMeta?.bindings || section.bindings || [])],
      responsive: { ...(section.studioMeta?.responsive || section.responsive || {}) },
      visibility: { ...(section.studioMeta?.visibility || section.visibility || {}) },
      customCss: section.customCss || section.styleConfig?.customCss || "",
    },
    index
  );

export const buildStudioPageFromPageConfig = (pageConfig = {}) => {
  const normalizedSections = normalizeSections(pageConfig.sections || []).map((section, index) =>
    normalizeStudioSection(section, index)
  );

  return {
    id: pageConfig._id?.toString?.() || "",
    pageType: pageConfig.pageType || "home",
    slug: pageConfig.slug || "/",
    pageName: pageConfig.title || "",
    title: pageConfig.title || "",
    status: pageConfig.status || "draft",
    seo: { ...(pageConfig.seo || {}) },
    templateSource: { ...(pageConfig.templateSource || {}) },
    themeTokens: { ...(pageConfig.templateStudio?.themeTokens || {}) },
    layout: {
      shell: pageConfig.templateStudio?.layoutShell || "",
    },
    sourceSummary: {
      pageId: pageConfig.templateStudio?.pageId || "",
      sourceType: pageConfig.templateStudio?.sourceType || "",
      ...(pageConfig.templateStudio?.sourceMeta || {}),
    },
    sections: normalizedSections,
  };
};

export const buildPageConfigFromStudioPage = ({ studioPage = {}, tenantId } = {}) => ({
  tenantId,
  pageType: studioPage.pageType || "home",
  slug: studioPage.slug || "/",
  title: studioPage.title || studioPage.pageName || "",
  status: studioPage.status || "draft",
  seo: { ...(studioPage.seo || {}) },
  templateSource: { ...(studioPage.templateSource || {}) },
    templateStudio: {
      pageId: studioPage.id || studioPage.sourceSummary?.pageId || "",
      sourceType: studioPage.sourceSummary?.sourceType || "",
      layoutShell: studioPage.layout?.shell || "",
      themeTokens: { ...(studioPage.themeTokens || {}) },
      sourceMeta: {
        ...(studioPage.sourceSummary || {}),
      },
    },
  sections: normalizeSections(studioPage.sections || []).map((section) => ({
    type: section.type,
    variant: section.variant || "default",
    order: section.order,
    enabled: section.enabled !== false,
    dataConfig: { ...(section.dataConfig || {}) },
    contentConfig: { ...(section.content || section.contentConfig || {}) },
    styleConfig: {
      ...(section.styles || section.styleConfig || {}),
      customCss: section.customCss || section.styles?.customCss || section.styleConfig?.customCss || "",
    },
    studioMeta: {
      label: section.label || "",
      sourceType: section.sourceType || "manual",
      sourceMeta: { ...(section.sourceMeta || {}) },
      bindings: [...(section.bindings || [])],
      responsive: { ...(section.responsive || {}) },
      visibility: { ...(section.visibility || {}) },
    },
  })),
});
