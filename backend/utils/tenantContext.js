import process from "node:process";
import { LEGACY_TENANT_DOMAINS, LEGACY_TENANT_SLUG, PLATFORM_DOMAINS } from "./tenantDefaults.js";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export const normalizeHostname = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");

export const isLocalHostname = (hostname = "") =>
  LOCAL_HOSTNAMES.has(normalizeHostname(hostname));

export const resolveTenantLookup = (req) => {
  const explicitSlug = (req.headers["x-tenant-slug"] || req.query.tenant || "")
    .toString()
    .trim()
    .toLowerCase();
  const explicitSubdomain = (req.headers["x-tenant-subdomain"] || "")
    .toString()
    .trim()
    .toLowerCase();
  const hostname = normalizeHostname(
    req.headers["x-forwarded-host"] || req.headers.host || ""
  );

  if (explicitSlug) {
    return { slug: explicitSlug, hostname };
  }

  if (explicitSubdomain) {
    return { subdomain: explicitSubdomain, hostname };
  }

  if (PLATFORM_DOMAINS.includes(hostname)) {
    return { isPlatform: true, hostname };
  }

  if (!hostname || isLocalHostname(hostname) || LEGACY_TENANT_DOMAINS.includes(hostname)) {
    return { slug: LEGACY_TENANT_SLUG, hostname };
  }

  const hostnameParts = hostname.split(".");
  if (hostnameParts.length >= 3 && hostnameParts[0] !== "www") {
    return { subdomain: hostnameParts[0], hostname };
  }

  return { customDomain: hostname, hostname };
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
