import Tenant from "../models/Tenant.js";
import { LEGACY_TENANT_SLUG } from "../utils/tenantDefaults.js";
import { resolveTenantLookup } from "../utils/tenantContext.js";

export const tenantMiddleware = async (req, res, next) => {
  try {
    const lookup = resolveTenantLookup(req);
    let tenant = null;

    if (lookup.slug) {
      tenant = await Tenant.findOne({ slug: lookup.slug, status: "active" });
    }

    if (!tenant && lookup.subdomain) {
      tenant = await Tenant.findOne({
        subdomain: lookup.subdomain,
        status: "active",
      });
    }

    if (!tenant && lookup.customDomain) {
      tenant = await Tenant.findOne({
        customDomains: lookup.customDomain,
        status: "active",
      });
    }

    if (!tenant && lookup.slug !== LEGACY_TENANT_SLUG) {
      tenant = await Tenant.findOne({ slug: LEGACY_TENANT_SLUG, status: "active" });
    }

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found for this request." });
    }

    req.tenant = tenant;
    req.tenantId = tenant._id;
    next();
  } catch (error) {
    next(error);
  }
};
