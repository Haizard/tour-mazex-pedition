import process from "node:process";
import Tenant from "../models/Tenant.js";
import TenantTheme from "../models/TenantTheme.js";
import TenantSiteConfig from "../models/TenantSiteConfig.js";
import PageConfig from "../models/PageConfig.js";
import TenantAdmin from "../models/TenantAdmin.js";
import PlatformAdmin from "../models/PlatformAdmin.js";
import Blog from "../models/Blog.js";
import Booking from "../models/Booking.js";
import ContactMessage from "../models/ContactMessage.js";
import CustomInquiry from "../models/CustomInquiry.js";
import Faq from "../models/Faq.js";
import Gallery from "../models/Gallery.js";
import HomeContent from "../models/HomeContent.js";
import MenuItem from "../models/MenuItem.js";
import SiteSettings from "../models/SiteSettings.js";
import Taxonomy from "../models/Taxonomy.js";
import TourPackage from "../models/TourPackage.js";
import Visionary from "../models/Visionary.js";
import {
  LEGACY_TENANT_DEMO_SLUG,
  DEFAULT_TENANT_SITE_CONFIG,
  DEFAULT_TENANT_THEME,
  LEGACY_TENANT_DOMAINS,
  LEGACY_TENANT_NAME,
  LEGACY_TENANT_SLUG,
  LEGACY_TENANT_SUBDOMAIN,
} from "./tenantDefaults.js";
import { HOME_PAGE_DEFAULT } from "./pageBuilderDefaults.js";
import { hashAdminPassword } from "./adminAuth.js";
import { buildDemoDomain, calculateNextRenewalDate } from "./domainProvisioning.js";
import { withDuplicateKeyRetry } from "./mongoWriteRetry.js";

const TENANT_OWNED_MODELS = [
  TourPackage,
  Blog,
  MenuItem,
  HomeContent,
  Gallery,
  Taxonomy,
  Booking,
  CustomInquiry,
  ContactMessage,
  Faq,
  Visionary,
];

const missingTenantFilter = {
  $or: [{ tenantId: { $exists: false } }, { tenantId: null }],
};

const SITE_SETTINGS_FIELDS = [
  "facebook",
  "twitter",
  "instagram",
  "whatsapp",
  "youtube",
  "reddit",
  "logoUrl",
];

const SITE_SETTINGS_DEFAULTS = Object.freeze(
  SITE_SETTINGS_FIELDS.reduce((accumulator, field) => ({ ...accumulator, [field]: "" }), {})
);

export const buildCanonicalLegacySiteSettingsPayload = (records = []) => {
  const normalizedRecords = [...(records || [])].sort((left, right) => {
    const leftDate = new Date(left?.updatedAt || left?.createdAt || 0).getTime();
    const rightDate = new Date(right?.updatedAt || right?.createdAt || 0).getTime();
    return rightDate - leftDate;
  });

  return normalizedRecords.reduce((payload, record) => {
    SITE_SETTINGS_FIELDS.forEach((field) => {
      if (!payload[field] && record?.[field]) {
        payload[field] = record[field];
      }
    });

    return payload;
  }, { ...SITE_SETTINGS_DEFAULTS });
};

export const buildLegacySiteSettingsUpsertUpdate = (tenantId, canonicalPayload) => ({
  $set: {
    ...canonicalPayload,
  },
  $setOnInsert: {
    tenantId,
    ...SITE_SETTINGS_DEFAULTS,
  },
});

const reconcileLegacySiteSettings = async (tenantId) => {
  const relatedRecords = await SiteSettings.find({
    $or: [{ tenantId }, missingTenantFilter],
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  const canonicalPayload = buildCanonicalLegacySiteSettingsPayload(relatedRecords);

  const canonicalRecord = await withDuplicateKeyRetry(
    () =>
      SiteSettings.findOneAndUpdate(
        { tenantId },
        buildLegacySiteSettingsUpsertUpdate(tenantId, canonicalPayload),
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      ),
    () =>
      SiteSettings.findOneAndUpdate(
        { tenantId },
        {
          $set: {
            ...canonicalPayload,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      )
  );

  await SiteSettings.deleteMany({
    _id: { $ne: canonicalRecord._id },
    $or: [{ tenantId }, missingTenantFilter],
  });
};

const safeDropIndex = async (Model, indexName) => {
  try {
    const indexes = await Model.collection.indexes();
    const exists = indexes.some((index) => index.name === indexName);
    if (exists) {
      await Model.collection.dropIndex(indexName);
    }
  } catch (_error) {
    // Ignore index cleanup issues for empty collections or first boot.
  }
};

export const ensureLegacyTenantFoundation = async () => {
  const tenant = await Tenant.findOneAndUpdate(
    { slug: LEGACY_TENANT_SLUG },
    {
      $setOnInsert: {
        name: LEGACY_TENANT_NAME,
        slug: LEGACY_TENANT_SLUG,
        subdomain: LEGACY_TENANT_SUBDOMAIN,
        demoDomain: buildDemoDomain(LEGACY_TENANT_DEMO_SLUG),
        customDomains: LEGACY_TENANT_DOMAINS,
        isLegacy: true,
        status: "active",
        features: {
          useNewUi: false,
          enablePageBuilder: false,
          enableAiContent: true,
          enableCustomDomains: true,
        },
        subscription: {
          plan: "pro",
          status: "active",
          billingInterval: "monthly",
          manualOverride: true,
        },
        domainService: {
          serviceStatus: "active",
          annualPriceUsd: 200,
          renewalCycle: "yearly",
          renewalDueAt: calculateNextRenewalDate(),
          includesHosting: true,
          includesManagedDns: true,
        },
      },
    },
    { new: true, upsert: true }
  );

  await Promise.all(
    TENANT_OWNED_MODELS.map((Model) =>
      Model.updateMany(missingTenantFilter, { $set: { tenantId: tenant._id } })
    )
  );

  await safeDropIndex(HomeContent, "section_1");
  await safeDropIndex(Taxonomy, "slug_1");
  await reconcileLegacySiteSettings(tenant._id);

  await TenantTheme.findOneAndUpdate(
    { tenantId: tenant._id },
    { $setOnInsert: { tenantId: tenant._id, ...DEFAULT_TENANT_THEME } },
    { upsert: true, new: true }
  );

  await TenantSiteConfig.findOneAndUpdate(
    { tenantId: tenant._id },
    { $setOnInsert: { tenantId: tenant._id, ...DEFAULT_TENANT_SITE_CONFIG } },
    { upsert: true, new: true }
  );

  await PageConfig.findOneAndUpdate(
    { tenantId: tenant._id, pageType: "home" },
    {
      $setOnInsert: {
        tenantId: tenant._id,
        ...HOME_PAGE_DEFAULT,
      },
    },
    { upsert: true, new: true }
  );

  const adminUsername = (
    process.env.LEGACY_ADMIN_USERNAME ||
    process.env.ADMIN_USERNAME ||
    "admin"
  )
    .trim()
    .toLowerCase();
  const adminPassword =
    process.env.LEGACY_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    "admin123";
  const passwordRecord = await hashAdminPassword(adminPassword);

  await TenantAdmin.findOneAndUpdate(
    { tenantId: tenant._id, username: adminUsername },
    {
      $setOnInsert: {
        tenantId: tenant._id,
        username: adminUsername,
        displayName: `${tenant.name} Admin`,
        role: "owner",
        status: "active",
        ...passwordRecord,
      },
    },
    { upsert: true, new: true }
  );

  const platformAdminUsername = (
    process.env.PLATFORM_ADMIN_USERNAME || "platform-admin"
  )
    .trim()
    .toLowerCase();
  const platformAdminPassword =
    process.env.PLATFORM_ADMIN_PASSWORD || adminPassword;
  const platformPasswordRecord = await hashAdminPassword(platformAdminPassword);

  await PlatformAdmin.findOneAndUpdate(
    { username: platformAdminUsername },
    {
      $setOnInsert: {
        username: platformAdminUsername,
        displayName: "Platform Admin",
        role: "super_admin",
        status: "active",
        ...platformPasswordRecord,
      },
    },
    { upsert: true, new: true }
  );

  return tenant;
};
