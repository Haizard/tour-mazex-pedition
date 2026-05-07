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
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const tenantBasePath = getTenantBasePath(pathname);

  if (!tenantBasePath) {
    return normalizedPath;
  }

  return normalizedPath === "/"
    ? tenantBasePath
    : `${tenantBasePath}${normalizedPath}`;
};

export const buildTenantScopedTourPath = (tour = {}, pathname = "") => {
  const slug = slugifyTitle(tour.title || "");
  const path = `/packages/${slug}`;
  const query = tour._id ? `?tourId=${encodeURIComponent(tour._id)}` : "";
  return `${buildTenantScopedPath(path, pathname)}${query}`;
};
