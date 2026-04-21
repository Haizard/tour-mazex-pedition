import express from "express";
import SiteSettings from "../models/SiteSettings.js";
import TenantTheme from "../models/TenantTheme.js";
import TenantSiteConfig from "../models/TenantSiteConfig.js";
import PageConfig from "../models/PageConfig.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { withTenantId } from "../utils/tenantContext.js";
import {
  DEFAULT_TENANT_SITE_CONFIG,
  DEFAULT_TENANT_THEME,
} from "../utils/tenantDefaults.js";

const router = express.Router();

router.get("/site-config", async (req, res) => {
  try {
    const config = await TenantSiteConfig.findOne({ tenantId: req.tenantId }).lean();
    res.status(200).json(config || DEFAULT_TENANT_SITE_CONFIG);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/site-config", requireTenantAdmin, async (req, res) => {
  try {
    const current = await TenantSiteConfig.findOne({ tenantId: req.tenantId }).lean();
    const nextValue = {
      ...(current || DEFAULT_TENANT_SITE_CONFIG),
      ...withTenantId(req, {}),
      navigationConfig: {
        ...(current?.navigationConfig || DEFAULT_TENANT_SITE_CONFIG.navigationConfig),
        ...(req.body.navigationConfig || {}),
      },
      footerConfig: {
        ...(current?.footerConfig || DEFAULT_TENANT_SITE_CONFIG.footerConfig),
        ...(req.body.footerConfig || {}),
      },
      homepageConfig: {
        ...(current?.homepageConfig || DEFAULT_TENANT_SITE_CONFIG.homepageConfig),
        ...(req.body.homepageConfig || {}),
      },
      enabledFeatures: req.body.enabledFeatures || current?.enabledFeatures || DEFAULT_TENANT_SITE_CONFIG.enabledFeatures,
    };

    const config = await TenantSiteConfig.findOneAndUpdate(
      { tenantId: req.tenantId },
      withTenantId(req, nextValue),
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json(config);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/bootstrap", async (req, res) => {
  try {
    const [theme, siteConfig, siteSettings, homePage] = await Promise.all([
      TenantTheme.findOne({ tenantId: req.tenantId }).lean(),
      TenantSiteConfig.findOne({ tenantId: req.tenantId }).lean(),
      SiteSettings.findOne({ tenantId: req.tenantId }).lean(),
      PageConfig.findOne({ tenantId: req.tenantId, pageType: "home" }).lean(),
    ]);

    res.status(200).json({
      tenant: {
        id: req.tenant._id,
        name: req.tenant.name,
        slug: req.tenant.slug,
        subdomain: req.tenant.subdomain,
        customDomains: req.tenant.customDomains || [],
        features: req.tenant.features || {},
      },
      theme: theme || DEFAULT_TENANT_THEME,
      siteConfig: siteConfig || DEFAULT_TENANT_SITE_CONFIG,
      siteSettings: siteSettings || null,
      pages: {
        home: homePage || null,
      },
    });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/theme", requireTenantAdmin, async (req, res) => {
  try {
    const current = await TenantTheme.findOne({ tenantId: req.tenantId }).lean();
    const nextValue = {
      ...(current || DEFAULT_TENANT_THEME),
      ...withTenantId(req, req.body),
    };

    const theme = await TenantTheme.findOneAndUpdate(
      { tenantId: req.tenantId },
      withTenantId(req, nextValue),
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json(theme);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
