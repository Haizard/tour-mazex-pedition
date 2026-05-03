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

const router = express.Router();

const getDistributionPayload = async (req) => {
  const [theme, siteSettings] = await Promise.all([
    TenantTheme.findOne(buildTenantFilter(req)).lean(),
    SiteSettings.findOne(buildTenantFilter(req)).lean(),
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
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
