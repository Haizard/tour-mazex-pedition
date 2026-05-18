const normalizePathname = (pathname = "") => pathname.toString().trim().toLowerCase();

export const shouldRefreshAdminSessionOnPath = (pathname = "") => {
  const normalizedPathname = normalizePathname(pathname);

  return (
    normalizedPathname.startsWith("/admin") ||
    normalizedPathname.endsWith("/login")
  );
};

export const shouldRefreshPlatformAdminSessionOnPath = (pathname = "") => {
  const normalizedPathname = normalizePathname(pathname);

  return (
    normalizedPathname.startsWith("/platform") ||
    normalizedPathname.startsWith("/super-admin")
  );
};
