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

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    subdomain: { type: String, trim: true, sparse: true, unique: true },
    customDomains: {
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
  },
  { timestamps: true }
);

tenantSchema.index({ customDomains: 1 });

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
