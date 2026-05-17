import process from "node:process";
import {
  LEGACY_TENANT_DOMAINS,
  LEGACY_TENANT_ROUTE_ALIASES,
  LEGACY_TENANT_SLUG,
  PLATFORM_DOMAINS,
} from "./tenantDefaults.js";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export const normalizeHostname = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .split(",")[0]
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");

export const isLocalHostname = (hostname = "") =>
  LOCAL_HOSTNAMES.has(normalizeHostname(hostname));

export const isPlatformHostname = (hostname = "") => {
  const normalizedHostname = normalizeHostname(hostname);
  return (
    PLATFORM_DOMAINS.includes(normalizedHostname) ||
    (normalizedHostname.endsWith(".vercel.app") &&
      !LEGACY_TENANT_DOMAINS.includes(normalizedHostname))
  );
};

export const getTenantRequestSource = (req) =>
  (req.headers["x-tenant-source"] || "")
    .toString()
    .trim()
    .toLowerCase();

export const isDemoTenantRequest = (req) => getTenantRequestSource(req) === "demo";

export const isDemoAccessAllowed = (tenant, req) =>
  !isDemoTenantRequest(req) || tenant?.demoAccessEnabled !== false;

export const resolveTenantLookup = (req) => {
  const requestedSlug = (req.headers["x-tenant-slug"] || req.query.tenant || "")
    .toString()
    .trim()
    .toLowerCase();
  const explicitSlug = LEGACY_TENANT_ROUTE_ALIASES.includes(requestedSlug)
    ? LEGACY_TENANT_SLUG
    : requestedSlug;
  const explicitSubdomain = (req.headers["x-tenant-subdomain"] || "")
    .toString()
    .trim()
    .toLowerCase();
  const hostname = normalizeHostname(
    req.headers["x-forwarded-host"] || req.headers.host || ""
  );
  const isPlatformHost = isPlatformHostname(hostname);
  const isDemoRequest = getTenantRequestSource(req) === "demo";

  if (isPlatformHost && !isDemoRequest && !req.query.tenant) {
    return { isPlatform: true, hostname };
  }

  if (explicitSlug) {
    return { slug: explicitSlug, hostname, allowLegacyFallback: false };
  }

  if (explicitSubdomain) {
    return { subdomain: explicitSubdomain, hostname, allowLegacyFallback: false };
  }

  if (isPlatformHost) {
    return { isPlatform: true, hostname };
  }

  if (!hostname || isLocalHostname(hostname) || LEGACY_TENANT_DOMAINS.includes(hostname)) {
    return { slug: LEGACY_TENANT_SLUG, hostname, allowLegacyFallback: true };
  }

  const hostnameParts = hostname.split(".");
  if (hostnameParts.length >= 3 && hostnameParts[0] !== "www") {
    return { subdomain: hostnameParts[0], hostname, allowLegacyFallback: false };
  }

  return { customDomain: hostname, hostname, allowLegacyFallback: false };
};

export const buildTenantFilter = (req, extra = {}) => ({
  tenantId: req.tenantId,
  ...extra,
});

export const withTenantId = (req, payload = {}) => ({
  ...payload,
  tenantId: req.tenantId,
});

export const resolveTenantBaseUrl = (req) => {
  const protocol =
    (req.headers["x-forwarded-proto"] || req.protocol || "https")
      .toString()
      .split(",")[0]
      .trim() || "https";
  const hostname = normalizeHostname(
    req.headers["x-forwarded-host"] || req.headers.host || ""
  );

  if (hostname && !isLocalHostname(hostname)) {
    return `${protocol}://${hostname}`;
  }

  const primaryDomain = req.tenant?.customDomains?.[0];
  if (primaryDomain) {
    return `https://${primaryDomain}`;
  }

  return process.env.SITE_URL || process.env.VITE_SITE_URL || "https://mazexpeditions.com";
};
