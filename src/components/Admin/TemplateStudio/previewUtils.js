import { buildCanvasSectionStyle } from "./canvasSectionStyles.js";

export function buildPreviewPageModel({ page = {}, viewport = "desktop" } = {}) {
  return {
    pageName: page.pageName || page.title || "Untitled Page",
    slug: page.slug || "/",
    status: page.status || "draft",
    viewport,
    theme: {
      canvasBackground: page.themeTokens?.canvasBackground || "#f4f7fb",
      contentWidth: page.themeTokens?.contentWidth || "1280px",
    },
    sections: (page.sections || []).map((section) => ({
      ...section,
      presentation: buildCanvasSectionStyle(section, viewport, false),
    })),
  };
}
