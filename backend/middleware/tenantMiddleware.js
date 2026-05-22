import Tenant from "../models/Tenant.js";
import { buildDemoDomain } from "../utils/domainProvisioning.js";
import { LEGACY_TENANT_SLUG } from "../utils/tenantDefaults.js";
import {
  getTenantRequestSource,
  isDemoAccessAllowed,
  isPlatformHostname,
  normalizeHostname,
  resolveTenantLookup,
} from "../utils/tenantContext.js";

export const shouldBypassTenantMiddleware = (req) => {
  const path = req.originalUrl || req.url || "";
  return (
    path.startsWith("/api/platform-auth") ||
    path.startsWith("/api/platform-admin") ||
    path.startsWith("/api/traveler-auth")
  );
};

const getHeaderHostname = (value = "") => normalizeHostname(value);

const isPlatformRequestHint = (req, lookup = {}) => {
  const originHost = getHeaderHostname(req.headers.origin);
  const refererHost = getHeaderHostname(req.headers.referer);

  return (
    isPlatformHostname(lookup.hostname) ||
    isPlatformHostname(originHost) ||
    isPlatformHostname(refererHost)
  );
};

export const shouldResolveMissingTenantAsPlatform = (req, lookup = {}) =>
  ["GET", "HEAD", "OPTIONS"].includes(req.method || "GET") &&
  getTenantRequestSource(req) !== "demo" &&
  isPlatformRequestHint(req, lookup);

export const tenantMiddleware = async (req, res, next) => {
  try {
    if (shouldBypassTenantMiddleware(req)) {
      return next();
    }

    const lookup = resolveTenantLookup(req);
    let tenant = null;

    if (lookup.isPlatform) {
      req.isPlatform = true;
      req.tenant = null;
      req.tenantId = null;
      return next();
    }

    if (lookup.slug) {
      tenant = await Tenant.findOne({ slug: lookup.slug, status: "active" }).lean();
    }

    if (!tenant && lookup.slug && getTenantRequestSource(req) === "demo") {
      tenant = await Tenant.findOne({
        subdomain: lookup.slug,
        status: "active",
      }).lean();
    }

    if (!tenant && lookup.slug && getTenantRequestSource(req) === "demo") {
      tenant = await Tenant.findOne({
        demoDomain: buildDemoDomain(lookup.slug),
        status: "active",
      }).lean();
    }

    if (!tenant && lookup.subdomain) {
      tenant = await Tenant.findOne({
        subdomain: lookup.subdomain,
        status: "active",
      }).lean();
    }

    if (!tenant && lookup.subdomain && getTenantRequestSource(req) === "demo") {
      tenant = await Tenant.findOne({
        demoDomain: buildDemoDomain(lookup.subdomain),
        status: "active",
      }).lean();
    }

    if (!tenant && lookup.customDomain) {
      tenant = await Tenant.findOne({
        customDomains: lookup.customDomain,
        status: "active",
      }).lean();
    }

    if (!tenant && lookup.allowLegacyFallback && lookup.slug !== LEGACY_TENANT_SLUG) {
      tenant = await Tenant.findOne({ slug: LEGACY_TENANT_SLUG, status: "active" }).lean();
    }

    if (!tenant && shouldResolveMissingTenantAsPlatform(req, lookup)) {
      req.isPlatform = true;
      req.tenant = null;
      req.tenantId = null;
      return next();
    }

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found for this request." });
    }

    if (!isDemoAccessAllowed(tenant, req)) {
      return res.status(403).json({ message: "Demo access is disabled for this tenant." });
    }

    req.tenant = tenant;
    req.tenantId = tenant._id;
    next();
  } catch (error) {
    next(error);
  }
};
