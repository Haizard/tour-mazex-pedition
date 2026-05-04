import express from "express";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import SiteSettings from "../models/SiteSettings.js";
import TenantTheme from "../models/TenantTheme.js";
import {
  buildDistributionLinkSet,
  buildPlannerEmbedSnippet,
  buildPublicDistributionBootstrap,
} from "../utils/distributionChannels.js";
import { buildTenantFilter, resolveTenantBaseUrl } from "../utils/tenantContext.js";
import ReferralPartner from "../models/ReferralPartner.js";
import Tenant from "../models/Tenant.js";

const router = express.Router();

const getDistributionPayload = async (req) => {
  const [theme, siteSettings, partners, tenantDoc] = await Promise.all([
    TenantTheme.findOne(buildTenantFilter(req)).lean(),
    SiteSettings.findOne(buildTenantFilter(req)).lean(),
    ReferralPartner.find(buildTenantFilter(req)).lean(),
    Tenant.findById(req.tenantId).select("settings.apiSecret").lean()
  ]);

  const baseUrl = resolveTenantBaseUrl(req);
  const links = buildDistributionLinkSet({
    baseUrl,
    tenantName: req.tenant?.name || "Tour Operator",
    tenantSlug: req.tenant?.slug || "",
    referralCode: req.query.referralCode || "",
    campaignLabel: req.query.campaign || "",
  });

  return {
    baseUrl,
    links,
    embedSnippet: buildPlannerEmbedSnippet({
      embedPlannerUrl: links.embedPlannerUrl,
      title: `${req.tenant?.name || "Tour Operator"} Trip Planner`,
    }),
    bootstrap: buildPublicDistributionBootstrap({
      tenant: req.tenant,
      theme,
      siteSettings,
      links,
    }),
    partners,
    apiSecret: tenantDoc?.settings?.apiSecret || "",
    tenantId: req.tenantId
  };
};

router.get("/bootstrap", async (req, res) => {
  try {
    const payload = await getDistributionPayload(req);
    res.status(200).json(payload.bootstrap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("social-posts"));

router.get("/summary", async (req, res) => {
  try {
    const payload = await getDistributionPayload(req);
    res.status(200).json({
      baseUrl: payload.baseUrl,
      links: payload.links,
      embedSnippet: payload.embedSnippet,
      bootstrap: payload.bootstrap,
      partners: payload.partners,
      apiSecret: payload.apiSecret,
      tenantId: payload.tenantId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/distribution/partners
 */
router.get("/partners", async (req, res) => {
  try {
    const partners = await ReferralPartner.find(buildTenantFilter(req)).lean();
    res.status(200).json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/distribution/partners
 */
router.post("/partners", async (req, res) => {
  try {
    const partner = new ReferralPartner({
      ...req.body,
      tenantId: req.tenantId
    });
    await partner.save();
    res.status(201).json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * DELETE /api/distribution/partners/:id
 */
router.delete("/partners/:id", async (req, res) => {
  try {
    await ReferralPartner.deleteOne({ _id: req.params.id, tenantId: req.tenantId });
    res.status(200).json({ message: "Partner deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
