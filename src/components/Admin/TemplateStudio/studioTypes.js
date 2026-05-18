export const STUDIO_TOPBAR_ACTIONS = [
  { id: "import", label: "Import", tone: "default" },
  { id: "ai-create", label: "AI Create", tone: "accent" },
  { id: "add-section", label: "Add Section", tone: "default" },
  { id: "preview", label: "Preview", tone: "subtle" },
  { id: "save", label: "Save", tone: "default" },
  { id: "publish", label: "Publish", tone: "strong" },
];

export const STUDIO_SIDEBAR_GROUPS = [
  {
    id: "pages",
    label: "Pages",
    items: ["Canvas Pages", "Landing Pages", "System Pages"],
  },
  {
    id: "templates",
    label: "Templates",
    items: ["Imported Templates", "Reusable Sections", "Saved Blocks"],
  },
  {
    id: "imports",
    label: "Imports",
    items: ["Code Intake", "Reference Uploads", "Recent Jobs"],
  },
  {
    id: "assets",
    label: "Assets",
    items: ["Media", "CMS Sources", "History"],
  },
];

export const DEFAULT_LIBRARY_SECTIONS = [
  {
    id: "library-hero",
    label: "Story Hero",
    type: "hero",
    sourceType: "reusable",
    summary: "A high-trust hero block for imported or manually composed pages.",
  },
  {
    id: "library-tour-grid",
    label: "Tour Grid",
    type: "featuredPackages",
    sourceType: "reusable",
    summary: "A dynamic package grid ready for tour bindings.",
  },
  {
    id: "library-review-wall",
    label: "Review Wall",
    type: "reviewWall",
    sourceType: "reusable",
    summary: "Traveler proof block for testimonials and verified feedback.",
  },
];

export const INSPECTOR_TABS = [
  { id: "content", label: "Content" },
  { id: "style", label: "Style" },
  { id: "binding", label: "Binding" },
  { id: "advanced", label: "Advanced" },
  { id: "responsive", label: "Responsive" },
];

export function createStudioSectionDraft(overrides = {}) {
  return {
    id: overrides.id || "section-draft",
    label: overrides.label || "Untitled Section",
    type: overrides.type || "custom",
    sourceType: overrides.sourceType || "manual",
    status: overrides.status || "draft",
    summary: overrides.summary || "Select a section to edit content, style, and bindings.",
    ...overrides,
  };
}

export function createStudioPageDraft(overrides = {}) {
  const resolvedTitle = overrides.pageName || overrides.title || "Untitled Page";
  return {
    id: overrides.id || "page-draft",
    pageName: resolvedTitle,
    title: resolvedTitle,
    pageType: overrides.pageType || "custom",
    status: overrides.status || "draft",
    sections: overrides.sections || [],
    ...overrides,
  };
}

export function pageConfigToStudioPage(pageConfig = {}, pageType = "home") {
  return createStudioPageDraft({
    id: pageConfig.templateStudio?.pageId || pageConfig._id || `${pageType}-page`,
    pageName: pageConfig.title || pageType,
    title: pageConfig.title || pageType,
    pageType: pageConfig.pageType || pageType,
    slug: pageConfig.slug || "/",
    status: pageConfig.status || "draft",
    themeTokens: pageConfig.templateStudio?.themeTokens || {},
    sourceSummary: {
      sourceType: pageConfig.templateStudio?.sourceType || "",
      ...(pageConfig.templateStudio?.sourceMeta || {}),
    },
    sections: (pageConfig.sections || []).map((section, index) =>
      createStudioSectionDraft({
        id: section._id?.toString?.() || section._id || `section-${index + 1}`,
        label: section.studioMeta?.label || section.contentConfig?.title || section.type,
        type: section.type,
        sourceType: section.studioMeta?.sourceType || "manual",
        sourceMeta: section.studioMeta?.sourceMeta || {},
        summary:
          section.contentConfig?.body ||
          section.contentConfig?.description ||
          "Select this section to edit content, styling, and bindings.",
        order: section.order || index + 1,
        enabled: section.enabled !== false,
        content: section.contentConfig || {},
        styles: section.styleConfig || {},
        bindings: section.studioMeta?.bindings || [],
        responsive: section.studioMeta?.responsive || {},
        visibility: section.studioMeta?.visibility || {},
        customCss: section.styleConfig?.customCss || "",
      })
    ),
  });
}

export function studioPageToPageConfig(studioPage = {}, currentPageConfig = {}) {
  return {
    ...currentPageConfig,
    pageType: studioPage.pageType || currentPageConfig.pageType || "home",
    slug: studioPage.slug || currentPageConfig.slug || "/",
    title: studioPage.pageName || currentPageConfig.title || "",
    status: studioPage.status || currentPageConfig.status || "draft",
    seo: studioPage.seo || currentPageConfig.seo || {},
    templateSource: studioPage.templateSource || currentPageConfig.templateSource || {},
    templateStudio: {
      ...(currentPageConfig.templateStudio || {}),
      pageId: studioPage.id || currentPageConfig.templateStudio?.pageId || "",
      sourceType: studioPage.sourceSummary?.sourceType || currentPageConfig.templateStudio?.sourceType || "",
      layoutShell: studioPage.layout?.shell || currentPageConfig.templateStudio?.layoutShell || "",
      themeTokens: studioPage.themeTokens || currentPageConfig.templateStudio?.themeTokens || {},
      sourceMeta: studioPage.sourceSummary || currentPageConfig.templateStudio?.sourceMeta || {},
    },
    sections: (studioPage.sections || []).map((section, index) => ({
      type: section.type,
      variant: section.variant || "default",
      order: section.order || index + 1,
      enabled: section.enabled !== false,
      dataConfig: section.dataConfig || {},
      contentConfig: section.content || {},
      styleConfig: {
        ...(section.styles || {}),
        customCss: section.customCss || section.styles?.customCss || "",
      },
      studioMeta: {
        label: section.label || "",
        sourceType: section.sourceType || "manual",
        sourceMeta: section.sourceMeta || {},
        bindings: section.bindings || [],
        responsive: section.responsive || {},
        visibility: section.visibility || {},
      },
    })),
  };
}
