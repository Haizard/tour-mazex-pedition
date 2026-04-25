import express from "express";
import SiteSettings from "../models/SiteSettings.js";
import Tenant from "../models/Tenant.js";
import TenantTheme from "../models/TenantTheme.js";
import TenantSiteConfig from "../models/TenantSiteConfig.js";
import PageConfig from "../models/PageConfig.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { withTenantId } from "../utils/tenantContext.js";
import {
  DEFAULT_TENANT_SITE_CONFIG,
  DEFAULT_TENANT_THEME,
  EMPTY_TENANT_SITE_CONFIG,
  LEGACY_TENANT_SLUG,
} from "../utils/tenantDefaults.js";
import { canAccessFeature, getPlanDefinition } from "../utils/subscriptionPlans.js";
import { buildDemoDomain, normalizeRequestedDomains } from "../utils/domainProvisioning.js";

const router = express.Router();

const getFallbackSiteConfig = (tenant) =>
  tenant?.slug === LEGACY_TENANT_SLUG
    ? DEFAULT_TENANT_SITE_CONFIG
    : EMPTY_TENANT_SITE_CONFIG;

const sanitizeSiteConfigForTenant = (tenant, config) => {
  const fallbackConfig = getFallbackSiteConfig(tenant);

  if (!config) {
    return fallbackConfig;
  }

  if (tenant?.slug === LEGACY_TENANT_SLUG) {
    return config;
  }

  const footerConfig =
    config.footerConfig?.brandName === DEFAULT_TENANT_SITE_CONFIG.footerConfig.brandName
      ? EMPTY_TENANT_SITE_CONFIG.footerConfig
      : config.footerConfig || EMPTY_TENANT_SITE_CONFIG.footerConfig;
  const navigationConfig =
    config.navigationConfig?.ctaLabel === DEFAULT_TENANT_SITE_CONFIG.navigationConfig.ctaLabel
      ? EMPTY_TENANT_SITE_CONFIG.navigationConfig
      : config.navigationConfig || EMPTY_TENANT_SITE_CONFIG.navigationConfig;

  return {
    ...config,
    footerConfig,
    navigationConfig,
  };
};

router.get("/site-config", async (req, res) => {
  try {
    const config = await TenantSiteConfig.findOne({ tenantId: req.tenantId }).lean();
    res.status(200).json(sanitizeSiteConfigForTenant(req.tenant, config));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/site-config", requireTenantAdmin, async (req, res) => {
  try {
    const fallbackConfig = getFallbackSiteConfig(req.tenant);
    const current = await TenantSiteConfig.findOne({ tenantId: req.tenantId }).lean();
    const nextValue = {
      ...(current || fallbackConfig),
      ...withTenantId(req, {}),
      navigationConfig: {
        ...(current?.navigationConfig || fallbackConfig.navigationConfig),
        ...(req.body.navigationConfig || {}),
      },
      footerConfig: {
        ...(current?.footerConfig || fallbackConfig.footerConfig),
        ...(req.body.footerConfig || {}),
      },
      homepageConfig: {
        ...(current?.homepageConfig || fallbackConfig.homepageConfig),
        ...(req.body.homepageConfig || {}),
      },
      enabledFeatures: req.body.enabledFeatures || current?.enabledFeatures || fallbackConfig.enabledFeatures,
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

    const demoDomain = req.tenant.demoDomain?.startsWith("http")
      ? req.tenant.demoDomain
      : buildDemoDomain(req.tenant.subdomain || req.tenant.slug);

    res.status(200).json({
      tenant: {
        id: req.tenant._id,
        name: req.tenant.name,
        slug: req.tenant.slug,
        subdomain: req.tenant.subdomain,
        demoDomain,
        customDomains: req.tenant.customDomains || [],
        requestedCustomDomains: req.tenant.requestedCustomDomains || [],
        features: req.tenant.features || {},
        subscription: req.tenant.subscription || null,
        domainService: req.tenant.domainService || null,
        access: {
          socialAccounts: canAccessFeature(req.tenant.subscription, "social-accounts"),
          socialPosts: canAccessFeature(req.tenant.subscription, "social-posts"),
          leadInbox: canAccessFeature(req.tenant.subscription, "lead-inbox"),
          repurposing: canAccessFeature(req.tenant.subscription, "repurposing"),
          reviewAutomation: canAccessFeature(req.tenant.subscription, "review-automation"),
          repeatCustomerAutomation: canAccessFeature(req.tenant.subscription, "repeat-customer-automation"),
          guideDriverManagement: canAccessFeature(req.tenant.subscription, "guide-driver-management"),
          accommodationCoordination: canAccessFeature(req.tenant.subscription, "accommodation-coordination"),
          airportPickupCoordination: canAccessFeature(req.tenant.subscription, "airport-pickup-coordination"),
          partnerPortal: canAccessFeature(req.tenant.subscription, "partner-portal"),
          campaigns: canAccessFeature(req.tenant.subscription, "campaigns"),
          whatsappAutomation: canAccessFeature(req.tenant.subscription, "whatsapp-automation"),
        },
        planDefinition: getPlanDefinition(req.tenant.subscription?.plan),
      },
      theme: theme || DEFAULT_TENANT_THEME,
      siteConfig: sanitizeSiteConfigForTenant(req.tenant, siteConfig),
      siteSettings: siteSettings || null,
      pages: {
        home: homePage || null,
      },
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

router.put("/domain-request", requireTenantAdmin, async (req, res) => {
  try {
    const requestedCustomDomains = normalizeRequestedDomains(
      Array.isArray(req.body.requestedCustomDomains)
        ? req.body.requestedCustomDomains
        : String(req.body.requestedCustomDomains || "")
            .split(/[,\n]/)
            .map((domain) => domain.trim())
    );

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { requestedCustomDomains },
      { new: true, runValidators: true }
    ).lean();

    res.status(200).json({
      tenant: {
        id: tenant._id,
        slug: tenant.slug,
        demoDomain: tenant.demoDomain || "",
        requestedCustomDomains: tenant.requestedCustomDomains || [],
        customDomains: tenant.customDomains || [],
        domainService: tenant.domainService || null,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
