const slugifyTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getTenantBasePath = (pathname = "") => {
  const match = pathname.toString().match(/^\/demo\/([^/?#]+)/);
  return match ? `/demo/${match[1]}` : "";
};

export const buildTenantScopedPath = (path = "", pathname = "") => {
  const rawPath = path.toString().trim();
  if (!rawPath) {
    return "/";
  }

  if (
    /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(rawPath) ||
    rawPath.startsWith("#")
  ) {
    return rawPath;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const tenantBasePath = getTenantBasePath(pathname);

  if (!tenantBasePath) {
    return normalizedPath;
  }

  if (
    normalizedPath === tenantBasePath ||
    normalizedPath.startsWith(`${tenantBasePath}/`)
  ) {
    return normalizedPath;
  }

  return normalizedPath === "/"
    ? tenantBasePath
    : `${tenantBasePath}${normalizedPath}`;
};

export const buildTenantScopedDestinationPath = (slug = "", pathname = "") => {
  const normalizedSlug = slug.toString().trim().replace(/^\/+|\/+$/g, "");
  return buildTenantScopedPath(`/destinations/${normalizedSlug}`, pathname);
};

export const buildTenantScopedTourPath = (tour = {}, pathname = "") => {
  const slug = slugifyTitle(tour.title || "");
  const path = `/packages/${slug}`;
  const query = tour._id ? `?tourId=${encodeURIComponent(tour._id)}` : "";
  return `${buildTenantScopedPath(path, pathname)}${query}`;
};

export const buildTenantScopedBlogPath = (slug = "", pathname = "") => {
  const normalizedSlug = slug.toString().trim().replace(/^\/+|\/+$/g, "");
  return buildTenantScopedPath(`/blogs/${normalizedSlug}`, pathname);
};

export const buildTenantScopedBlogCategoryPath = (categoryId = "", pathname = "") => {
  const normalizedCategoryId = categoryId.toString().trim().replace(/^\/+|\/+$/g, "");
  return buildTenantScopedPath(`/blogs/category/${normalizedCategoryId}`, pathname);
};
