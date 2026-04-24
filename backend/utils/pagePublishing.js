export const normalizePageSlug = (slug = "/") => {
  const trimmed = `/${String(slug || "/")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")}`;

  return trimmed === "/" ? "/" : trimmed;
};

export const getDefaultPageSlug = (pageType = "home") =>
  pageType === "home" ? "/" : `/${pageType}`;

export const canViewUnpublishedPage = (req = {}) =>
  Boolean(req?.admin || req?.platformAdmin);

export const isPagePubliclyAccessible = (page, req = {}) => {
  if (!page) {
    return false;
  }

  if (canViewUnpublishedPage(req)) {
    return true;
  }

  return page.status === "published";
};
