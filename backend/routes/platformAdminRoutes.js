import crypto from "crypto";
import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import CustomInquiry from "../models/CustomInquiry.js";
import Campaign from "../models/Campaign.js";
import SocialAccount from "../models/SocialAccount.js";
import SocialPost from "../models/SocialPost.js";
import Tenant from "../models/Tenant.js";
import TenantAdmin from "../models/TenantAdmin.js";
import TenantTheme from "../models/TenantTheme.js";
import TenantSiteConfig from "../models/TenantSiteConfig.js";
import EmailProviderConnection from "../models/EmailProviderConnection.js";
import EmailThread from "../models/EmailThread.js";
import PageConfig from "../models/PageConfig.js";
import { requirePlatformAdmin } from "../middleware/platformAdminAuthMiddleware.js";
import {
  DEFAULT_TENANT_SITE_CONFIG,
  DEFAULT_TENANT_THEME,
} from "../utils/tenantDefaults.js";
import { HOME_PAGE_DEFAULT } from "../utils/pageBuilderDefaults.js";
import { hashAdminPassword } from "../utils/adminAuth.js";
import {
  buildDemoDomain,
  calculateNextRenewalDate,
  normalizeAnnualDomainPrice,
  normalizeRequestedDomains,
  slugifyTenantValue,
} from "../utils/domainProvisioning.js";

const router = express.Router();

router.use(requirePlatformAdmin);

const getPlatformDomainTarget = () =>
  process.env.PLATFORM_DOMAIN_TARGET || "app.mazex-platform.example";

const createUniqueTenantIdentifiers = async (name, preferredSlug = "", preferredSubdomain = "") => {
  const baseSlug = slugifyTenantValue(preferredSlug || name) || "tenant";
  const baseSubdomain = slugifyTenantValue(preferredSubdomain || preferredSlug || name) || "tenant";

  let attempt = 0;
  let slug = baseSlug;
  let subdomain = baseSubdomain;

  // Keep incrementing until both identifiers are available together.
  while (true) {
    const existingTenant = await Tenant.findOne({
      $or: [{ slug }, { subdomain }, { demoDomain: buildDemoDomain(subdomain) }],
    })
      .select("_id")
      .lean();

    if (!existingTenant) {
      return { slug, subdomain };
    }

    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
    subdomain = `${baseSubdomain}-${attempt + 1}`;
  }
};

const normalizeDomainRecord = (domain, existingRecord = null) => {
  const normalizedDomain = domain.toString().trim().toLowerCase();

  if (existingRecord) {
    return {
      ...existingRecord,
      domain: normalizedDomain,
      verificationHost:
        existingRecord.verificationHost || `_mazex.${normalizedDomain}`,
      verificationValue:
        existingRecord.verificationValue ||
        `maz-verify=${
          existingRecord.verificationToken || crypto.randomBytes(12).toString("hex")
        }`,
      expectedTarget: existingRecord.expectedTarget || getPlatformDomainTarget(),
    };
  }

  const verificationToken = crypto.randomBytes(12).toString("hex");

  return {
    domain: normalizedDomain,
    status: "pending",
    verificationType: "TXT",
    verificationHost: `_mazex.${normalizedDomain}`,
    verificationValue: `maz-verify=${verificationToken}`,
    expectedTarget: getPlatformDomainTarget(),
    verificationToken,
    verifiedAt: null,
    lastCheckedAt: null,
    errorMessage: "",
  };
};

router.get("/summary", async (_req, res) => {
  try {
    const [
      tenantCount,
      activeTenantCount,
      tenantAdminCount,
      emailConnectionCount,
      inquiryCount,
      contactMessageCount,
      openThreadCount,
      socialAccountCount,
      socialPostCount,
      campaignCount,
    ] =
      await Promise.all([
        Tenant.countDocuments(),
        Tenant.countDocuments({ status: "active" }),
        TenantAdmin.countDocuments({ status: "active" }),
        EmailProviderConnection.countDocuments(),
        CustomInquiry.countDocuments(),
        ContactMessage.countDocuments(),
        EmailThread.countDocuments({ status: { $in: ["open", "pending"] } }),
        SocialAccount.countDocuments(),
        SocialPost.countDocuments(),
        Campaign.countDocuments(),
      ]);

    const capabilities = {
      tenantManagement: true,
      tenantSupport: true,
      emailArchitectureScaffolded: true,
      customDomainManagement: true,
      domainVerificationScaffolded: true,
      domainServiceBilling: true,
    };

    res.status(200).json({
      totals: {
        tenants: tenantCount,
        activeTenants: activeTenantCount,
        tenantAdmins: tenantAdminCount,
        emailConnections: emailConnectionCount,
      },
      summary: {
        tenantCount,
        activeTenantCount,
        tenantAdminCount,
        emailConnectionCount,
        inquiryCount,
        contactMessageCount,
        openThreadCount,
        socialAccountCount,
        socialPostCount,
        campaignCount,
        capabilities,
      },
      capabilities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/tenants", async (_req, res) => {
  try {
    const tenants = await Tenant.find()
      .sort({ createdAt: -1 })
      .lean();

    const tenantIds = tenants.map((tenant) => tenant._id);
    const [
      adminCounts,
      tenantAdmins,
      pageCounts,
      emailCounts,
      inquiryCounts,
      messageCounts,
      threadCounts,
      socialAccountCounts,
      socialPostCounts,
      campaignCounts,
    ] = await Promise.all([
      TenantAdmin.aggregate([
        { $match: { tenantId: { $in: tenantIds }, status: "active" } },
        { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      ]),
      TenantAdmin.find({ tenantId: { $in: tenantIds } })
        .sort({ role: -1, createdAt: 1 })
        .select("_id tenantId username displayName role status lastLoginAt")
        .lean(),
      PageConfig.aggregate([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      ]),
      EmailProviderConnection.aggregate([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      ]),
      CustomInquiry.aggregate([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      ]),
      ContactMessage.aggregate([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      ]),
      EmailThread.aggregate([
        { $match: { tenantId: { $in: tenantIds }, status: { $in: ["open", "pending"] } } },
        { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      ]),
      SocialAccount.aggregate([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      ]),
      SocialPost.aggregate([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      ]),
      Campaign.aggregate([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      ]),
    ]);

    const toLookup = (items) =>
      items.reduce((accumulator, item) => {
        accumulator[String(item._id)] = item.count;
        return accumulator;
      }, {});

    const adminLookup = toLookup(adminCounts);
    const adminListLookup = tenantAdmins.reduce((accumulator, admin) => {
      const tenantId = String(admin.tenantId);
      if (!accumulator[tenantId]) {
        accumulator[tenantId] = [];
      }
      accumulator[tenantId].push(admin);
      return accumulator;
    }, {});
    const pageLookup = toLookup(pageCounts);
    const emailLookup = toLookup(emailCounts);
    const inquiryLookup = toLookup(inquiryCounts);
    const messageLookup = toLookup(messageCounts);
    const threadLookup = toLookup(threadCounts);
    const socialAccountLookup = toLookup(socialAccountCounts);
    const socialPostLookup = toLookup(socialPostCounts);
    const campaignLookup = toLookup(campaignCounts);

    res.status(200).json(
      tenants.map((tenant) => ({
        ...tenant,
        demoDomain: tenant.demoDomain?.startsWith("http")
          ? tenant.demoDomain
          : buildDemoDomain(tenant.subdomain || tenant.slug),
        primaryDomain: tenant.customDomains?.[0] || "",
        adminCount: adminLookup[String(tenant._id)] || 0,
        admins: adminListLookup[String(tenant._id)] || [],
        pageConfigCount: pageLookup[String(tenant._id)] || 0,
        emailConnectionCount: emailLookup[String(tenant._id)] || 0,
        inquiryCount: inquiryLookup[String(tenant._id)] || 0,
        contactMessageCount: messageLookup[String(tenant._id)] || 0,
        openThreadCount: threadLookup[String(tenant._id)] || 0,
        socialAccountCount: socialAccountLookup[String(tenant._id)] || 0,
        socialPostCount: socialPostLookup[String(tenant._id)] || 0,
        campaignCount: campaignLookup[String(tenant._id)] || 0,
        metrics: {
          admins: adminLookup[String(tenant._id)] || 0,
          pageConfigs: pageLookup[String(tenant._id)] || 0,
          emailConnections: emailLookup[String(tenant._id)] || 0,
          inquiries: inquiryLookup[String(tenant._id)] || 0,
          contactMessages: messageLookup[String(tenant._id)] || 0,
          openThreads: threadLookup[String(tenant._id)] || 0,
          socialAccounts: socialAccountLookup[String(tenant._id)] || 0,
          socialPosts: socialPostLookup[String(tenant._id)] || 0,
          campaigns: campaignLookup[String(tenant._id)] || 0,
        },
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/tenants/:tenantId/admin", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.tenantId).lean();

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    const username = req.body.username?.toString().trim().toLowerCase();
    const displayName = req.body.displayName?.toString().trim();
    const password = req.body.password?.toString() || "";
    const status = req.body.status?.toString() || "active";

    if (!username) {
      return res.status(400).json({ message: "Tenant admin username is required." });
    }

    const existingForUsername = await TenantAdmin.findOne({
      tenantId: tenant._id,
      username,
    });

    const existingAdmin =
      existingForUsername ||
      (await TenantAdmin.findOne({ tenantId: tenant._id, role: "owner" }).sort({
        createdAt: 1,
      })) ||
      (await TenantAdmin.findOne({ tenantId: tenant._id }).sort({ createdAt: 1 }));

    const update = {
      tenantId: tenant._id,
      username,
      displayName: displayName || `${tenant.name} Admin`,
      role: existingAdmin?.role || "owner",
      status: ["active", "disabled"].includes(status) ? status : "active",
    };

    if (password) {
      Object.assign(update, await hashAdminPassword(password));
    }

    if (!existingAdmin && !password) {
      return res.status(400).json({
        message: "Password is required when creating the tenant admin.",
      });
    }

    const admin = existingAdmin
      ? await TenantAdmin.findByIdAndUpdate(existingAdmin._id, update, {
          new: true,
          runValidators: true,
        }).lean()
      : await TenantAdmin.create(update);

    res.status(200).json({
      admin: {
        _id: admin._id,
        tenantId: admin.tenantId,
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
        status: admin.status,
        lastLoginAt: admin.lastLoginAt,
      },
      passwordUpdated: Boolean(password),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/tenants/:tenantId/support", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.tenantId).lean();
    const unresolvedOnly = req.query.mode === "unresolved";

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    const [inquiries, contactMessages, threads] = await Promise.all([
      CustomInquiry.find({
        tenantId: tenant._id,
        ...(unresolvedOnly
          ? { status: { $nin: ["Booked", "Cancelled"] } }
          : {}),
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("_id name email status destinations createdAt")
        .lean(),
      ContactMessage.find({
        tenantId: tenant._id,
        ...(unresolvedOnly
          ? { status: { $ne: "Replied" } }
          : {}),
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("_id name email status message createdAt")
        .lean(),
      EmailThread.find({
        tenantId: tenant._id,
        ...(unresolvedOnly
          ? { status: { $in: ["open", "pending"] } }
          : {}),
      })
        .sort({ updatedAt: -1, lastMessageAt: -1 })
        .limit(8)
        .select("_id subject participants status mailboxFolder previewText inquiryId contactMessageId updatedAt lastMessageAt")
        .lean(),
    ]);

    res.status(200).json({
      support: {
        tenant: {
          _id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
        },
        mode: unresolvedOnly ? "unresolved" : "recent",
        inquiries,
        contactMessages,
        threads,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/tenants", async (req, res) => {
  try {
    const name = req.body.name?.toString().trim();

    if (!name) {
      return res.status(400).json({ message: "Tenant name is required." });
    }

    const { slug, subdomain } = await createUniqueTenantIdentifiers(
      name,
      req.body.slug,
      req.body.subdomain
    );

    const adminUsername = slugifyTenantValue(req.body.adminUsername || `${slug}-admin`) || `${slug}-admin`;
    const adminPassword = req.body.adminPassword?.toString() || "tenant123";
    const passwordRecord = await hashAdminPassword(adminPassword);
    const annualPriceUsd = normalizeAnnualDomainPrice(req.body.domainService?.annualPriceUsd);
    const renewalDueAt = req.body.domainService?.renewalDueAt
      ? new Date(req.body.domainService.renewalDueAt)
      : calculateNextRenewalDate();

    const tenant = await Tenant.create({
      name,
      slug,
      subdomain,
      demoDomain: buildDemoDomain(subdomain),
      customDomains: [],
      requestedCustomDomains: normalizeRequestedDomains(req.body.requestedCustomDomains || []),
      status: req.body.status || "active",
      features: {
        useNewUi: false,
        enablePageBuilder: true,
        enableAiContent: true,
        enableCustomDomains: true,
        ...(req.body.features || {}),
      },
      subscription: {
        plan: req.body.subscription?.plan || "starter",
        status: req.body.subscription?.status || "trialing",
        trialEndsAt: req.body.subscription?.trialEndsAt || null,
        currentPeriodEndsAt: req.body.subscription?.currentPeriodEndsAt || null,
        billingInterval: req.body.subscription?.billingInterval || "monthly",
        manualOverride: req.body.subscription?.manualOverride ?? true,
      },
      domainService: {
        serviceStatus: req.body.domainService?.serviceStatus || "active",
        annualPriceUsd,
        renewalCycle: "yearly",
        renewalDueAt,
        lastRenewedAt: new Date(),
        includesHosting: req.body.domainService?.includesHosting ?? true,
        includesManagedDns: req.body.domainService?.includesManagedDns ?? true,
      },
    });

    await Promise.all([
      TenantTheme.findOneAndUpdate(
        { tenantId: tenant._id },
        { $setOnInsert: { tenantId: tenant._id, ...DEFAULT_TENANT_THEME } },
        { upsert: true, new: true }
      ),
      TenantSiteConfig.findOneAndUpdate(
        { tenantId: tenant._id },
        { $setOnInsert: { tenantId: tenant._id, ...DEFAULT_TENANT_SITE_CONFIG } },
        { upsert: true, new: true }
      ),
      PageConfig.findOneAndUpdate(
        { tenantId: tenant._id, pageType: "home" },
        { $setOnInsert: { tenantId: tenant._id, ...HOME_PAGE_DEFAULT } },
        { upsert: true, new: true }
      ),
      TenantAdmin.findOneAndUpdate(
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
      ),
    ]);

    res.status(201).json({
      tenant: {
        ...tenant.toObject(),
        primaryDomain: tenant.customDomains?.[0] || "",
      },
      credentials: {
        adminUsername,
        adminPassword,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/tenants/:tenantId/marketing", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.tenantId).lean();

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    const [socialAccounts, socialPosts, campaigns, inquiries] = await Promise.all([
      SocialAccount.find({ tenantId: tenant._id }).sort({ updatedAt: -1 }).limit(10).lean(),
      SocialPost.find({ tenantId: tenant._id }).sort({ updatedAt: -1 }).limit(10).lean(),
      Campaign.find({ tenantId: tenant._id }).sort({ updatedAt: -1 }).limit(10).lean(),
      CustomInquiry.find({ tenantId: tenant._id })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("_id name phone sourceChannel status leadStage createdAt")
        .lean(),
    ]);

    res.status(200).json({
      marketing: {
        tenant: {
          _id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
        },
        socialAccounts,
        socialPosts,
        campaigns,
        inquiries,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/tenants/:tenantId", async (req, res) => {
  try {
    const update = {};
    const existingTenant = await Tenant.findById(req.params.tenantId).lean();

    if (!existingTenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    if (typeof req.body.name === "string") {
      update.name = req.body.name.trim();
    }

    if (typeof req.body.subdomain === "string") {
      const nextSubdomain = req.body.subdomain.trim().toLowerCase() || undefined;
      update.subdomain = nextSubdomain;
      update.demoDomain = nextSubdomain ? buildDemoDomain(nextSubdomain) : "";
      update.subdomainStatus = nextSubdomain ? "pending" : "unconfigured";
      update.subdomainVerifiedAt = nextSubdomain ? null : null;
    }

    if (typeof req.body.status === "string") {
      update.status = req.body.status;
    }

    if (Array.isArray(req.body.customDomains)) {
      update.customDomains = req.body.customDomains
        .map((domain) => domain?.toString().trim().toLowerCase())
        .filter(Boolean);

      const existingRecordLookup = Object.fromEntries(
        (existingTenant.customDomainRecords || []).map((record) => [
          record.domain,
          record,
        ])
      );

      update.customDomainRecords = update.customDomains.map((domain) =>
        normalizeDomainRecord(domain, existingRecordLookup[domain])
      );
    }

    if (Array.isArray(req.body.requestedCustomDomains)) {
      update.requestedCustomDomains = normalizeRequestedDomains(
        req.body.requestedCustomDomains
      );
    }

    if (req.body.features && typeof req.body.features === "object") {
      update.features = {
        ...(req.body.currentFeatures || {}),
        ...req.body.features,
      };
    }

    if (req.body.subscription && typeof req.body.subscription === "object") {
      update.subscription = {
        ...(existingTenant.subscription || {}),
        ...req.body.subscription,
      };
    }

    if (req.body.domainService && typeof req.body.domainService === "object") {
      update.domainService = {
        ...(existingTenant.domainService || {}),
        ...req.body.domainService,
        annualPriceUsd: normalizeAnnualDomainPrice(
          req.body.domainService.annualPriceUsd ??
            existingTenant.domainService?.annualPriceUsd
        ),
      };
    }

    const tenant = await Tenant.findByIdAndUpdate(req.params.tenantId, update, {
      new: true,
      runValidators: true,
    }).lean();

    res.status(200).json({
      tenant: {
        ...tenant,
        demoDomain: tenant.demoDomain?.startsWith("http")
          ? tenant.demoDomain
          : buildDemoDomain(tenant.subdomain || tenant.slug),
        primaryDomain: tenant.customDomains?.[0] || "",
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/tenants/:tenantId/renew-domain-service", async (req, res) => {
  try {
    const annualPriceUsd = normalizeAnnualDomainPrice(req.body.annualPriceUsd);
    const renewalDate = new Date();
    const renewalDueAt = calculateNextRenewalDate(renewalDate);

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.tenantId,
      {
        $set: {
          "domainService.serviceStatus": "active",
          "domainService.annualPriceUsd": annualPriceUsd,
          "domainService.lastRenewedAt": renewalDate,
          "domainService.renewalDueAt": renewalDueAt,
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    res.status(200).json({
      tenant: {
        ...tenant,
        demoDomain: tenant.demoDomain?.startsWith("http")
          ? tenant.demoDomain
          : buildDemoDomain(tenant.subdomain || tenant.slug),
        primaryDomain: tenant.customDomains?.[0] || "",
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/tenants/:tenantId/domains/:domain/mark-verified", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.tenantId);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    const normalizedDomain = req.params.domain.trim().toLowerCase();
    const nextRecords = (tenant.customDomainRecords || []).map((record) => {
      const rawRecord = record.toObject ? record.toObject() : record;

      if (rawRecord.domain !== normalizedDomain) {
        return rawRecord;
      }

      return {
        ...rawRecord,
        status: "verified",
        verifiedAt: new Date(),
        lastCheckedAt: new Date(),
        errorMessage: "",
      };
    });

    tenant.customDomainRecords = nextRecords;
    await tenant.save();

    res.status(200).json({
      tenant: {
        ...tenant.toObject(),
        demoDomain: tenant.demoDomain?.startsWith("http")
          ? tenant.demoDomain
          : buildDemoDomain(tenant.subdomain || tenant.slug),
        primaryDomain: tenant.customDomains?.[0] || "",
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
