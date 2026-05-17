import mongoose from "mongoose";

const customDomainRecordSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["pending", "verified", "error"],
      default: "pending",
    },
    verificationType: {
      type: String,
      enum: ["TXT", "CNAME"],
      default: "TXT",
    },
    verificationHost: { type: String, default: "" },
    verificationValue: { type: String, default: "" },
    expectedTarget: { type: String, default: "" },
    verificationToken: { type: String, default: "" },
    verifiedAt: { type: Date, default: null },
    lastCheckedAt: { type: Date, default: null },
    errorMessage: { type: String, default: "" },
  },
  { _id: false }
);

const domainServiceSchema = new mongoose.Schema(
  {
    serviceStatus: {
      type: String,
      enum: ["active", "pending_renewal", "expired"],
      default: "active",
    },
    annualPriceUsd: {
      type: Number,
      min: 50,
      max: 200,
      default: 50,
    },
    renewalCycle: {
      type: String,
      enum: ["yearly"],
      default: "yearly",
    },
    renewalDueAt: { type: Date, default: null },
    lastRenewedAt: { type: Date, default: null },
    includesHosting: { type: Boolean, default: true },
    includesManagedDns: { type: Boolean, default: true },
  },
  { _id: false }
);

const domainProviderSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["manual", "cloudflare", "namecheap", "godaddy"],
      default: "manual",
    },
    autoManageDns: { type: Boolean, default: false },
    zoneId: { type: String, default: "" },
    accountId: { type: String, default: "" },
    nameserverMode: {
      type: String,
      enum: ["external", "delegated"],
      default: "external",
    },
  },
  { _id: false }
);

const marketplaceSettingsSchema = new mongoose.Schema(
  {
    autoPublishVerifiedReviews: { type: Boolean, default: false },
    autoPublishTravelerQuestions: { type: Boolean, default: false },
    requirePhotoModeration: { type: Boolean, default: true },
    includeInquiryFeedbackInRatings: { type: Boolean, default: false },
    allowCommunityQnA: { type: Boolean, default: true },
  },
  { _id: false }
);

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    subdomain: { type: String, trim: true, sparse: true, unique: true },
    demoDomain: { type: String, trim: true, sparse: true, unique: true },
    demoAccessEnabled: { type: Boolean, default: true },
    customDomains: {
      type: [String],
      default: [],
      set: (domains) =>
        (domains || []).map((domain) => domain.toString().trim().toLowerCase()),
    },
    requestedCustomDomains: {
      type: [String],
      default: [],
      set: (domains) =>
        (domains || []).map((domain) => domain.toString().trim().toLowerCase()),
    },
    customDomainRecords: {
      type: [customDomainRecordSchema],
      default: [],
    },
    subdomainStatus: {
      type: String,
      enum: ["unconfigured", "pending", "verified"],
      default: "unconfigured",
    },
    subdomainVerifiedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },
    isLegacy: { type: Boolean, default: false },
    features: {
      useNewUi: { type: Boolean, default: false },
      enablePageBuilder: { type: Boolean, default: false },
      enableAiContent: { type: Boolean, default: true },
      enableCustomDomains: { type: Boolean, default: false },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["starter", "growth", "pro", "enterprise"],
        default: "starter",
      },
      status: {
        type: String,
        enum: ["inactive", "trialing", "active", "past_due", "cancelled"],
        default: "trialing",
      },
      trialEndsAt: { type: Date, default: null },
      currentPeriodEndsAt: { type: Date, default: null },
      billingInterval: {
        type: String,
        enum: ["monthly", "yearly", "custom"],
        default: "monthly",
      },
      manualOverride: { type: Boolean, default: true },
      featureOverrides: {
        type: Map,
        of: Boolean,
        default: {},
      },
    },
    domainService: {
      type: domainServiceSchema,
      default: () => ({
        serviceStatus: "active",
        annualPriceUsd: 50,
        renewalCycle: "yearly",
        includesHosting: true,
        includesManagedDns: true,
      }),
    },
    domainProvider: {
      type: domainProviderSchema,
      default: () => ({
        provider: "manual",
        autoManageDns: false,
        zoneId: "",
        accountId: "",
        nameserverMode: "external",
      }),
    },
    marketplaceSettings: {
      type: marketplaceSettingsSchema,
      default: () => ({
        autoPublishVerifiedReviews: false,
        autoPublishTravelerQuestions: false,
        requirePhotoModeration: true,
        includeInquiryFeedbackInRatings: false,
        allowCommunityQnA: true,
      }),
    },
    purchasedTemplates: {
      type: [String],
      default: [],
      set: (templates) =>
        [...new Set((templates || []).map((template) => template.toString().trim()).filter(Boolean))],
    },
    requestedTemplates: {
      type: [String],
      default: [],
      set: (templates) =>
        [...new Set((templates || []).map((template) => template.toString().trim()).filter(Boolean))],
    },
  },
  { timestamps: true }
);

tenantSchema.index({ customDomains: 1 });
tenantSchema.index({ requestedCustomDomains: 1 });

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
