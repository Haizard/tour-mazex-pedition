import crypto from "crypto";
import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import CustomInquiry from "../models/CustomInquiry.js";
import Tenant from "../models/Tenant.js";
import TenantAdmin from "../models/TenantAdmin.js";
import EmailProviderConnection from "../models/EmailProviderConnection.js";
import EmailThread from "../models/EmailThread.js";
import PageConfig from "../models/PageConfig.js";
import { requirePlatformAdmin } from "../middleware/platformAdminAuthMiddleware.js";

const router = express.Router();

router.use(requirePlatformAdmin);

const getPlatformDomainTarget = () =>
  process.env.PLATFORM_DOMAIN_TARGET || "app.mazex-platform.example";

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
    ] =
      await Promise.all([
        Tenant.countDocuments(),
        Tenant.countDocuments({ status: "active" }),
        TenantAdmin.countDocuments({ status: "active" }),
        EmailProviderConnection.countDocuments(),
        CustomInquiry.countDocuments(),
        ContactMessage.countDocuments(),
        EmailThread.countDocuments({ status: { $in: ["open", "pending"] } }),
      ]);

    const capabilities = {
      tenantManagement: true,
      tenantSupport: true,
      emailArchitectureScaffolded: true,
      customDomainManagement: true,
      domainVerificationScaffolded: true,
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
    const [adminCounts, pageCounts, emailCounts, inquiryCounts, messageCounts, threadCounts] = await Promise.all([
      TenantAdmin.aggregate([
        { $match: { tenantId: { $in: tenantIds }, status: "active" } },
        { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      ]),
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
    ]);

    const toLookup = (items) =>
      items.reduce((accumulator, item) => {
        accumulator[String(item._id)] = item.count;
        return accumulator;
      }, {});

    const adminLookup = toLookup(adminCounts);
    const pageLookup = toLookup(pageCounts);
    const emailLookup = toLookup(emailCounts);
    const inquiryLookup = toLookup(inquiryCounts);
    const messageLookup = toLookup(messageCounts);
    const threadLookup = toLookup(threadCounts);

    res.status(200).json(
      tenants.map((tenant) => ({
        ...tenant,
        primaryDomain: tenant.customDomains?.[0] || "",
        adminCount: adminLookup[String(tenant._id)] || 0,
        pageConfigCount: pageLookup[String(tenant._id)] || 0,
        emailConnectionCount: emailLookup[String(tenant._id)] || 0,
        inquiryCount: inquiryLookup[String(tenant._id)] || 0,
        contactMessageCount: messageLookup[String(tenant._id)] || 0,
        openThreadCount: threadLookup[String(tenant._id)] || 0,
        metrics: {
          admins: adminLookup[String(tenant._id)] || 0,
          pageConfigs: pageLookup[String(tenant._id)] || 0,
          emailConnections: emailLookup[String(tenant._id)] || 0,
          inquiries: inquiryLookup[String(tenant._id)] || 0,
          contactMessages: messageLookup[String(tenant._id)] || 0,
          openThreads: threadLookup[String(tenant._id)] || 0,
        },
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    if (req.body.features && typeof req.body.features === "object") {
      update.features = {
        ...(req.body.currentFeatures || {}),
        ...req.body.features,
      };
    }

    const tenant = await Tenant.findByIdAndUpdate(req.params.tenantId, update, {
      new: true,
      runValidators: true,
    }).lean();

    res.status(200).json({
      tenant: {
        ...tenant,
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
        primaryDomain: tenant.customDomains?.[0] || "",
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
