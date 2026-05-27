import mongoose from "mongoose";

export const PLATFORM_OUTREACH_PROSPECT_STATUSES = [
  "new",
  "queued",
  "contacted",
  "replied",
  "qualified",
  "unqualified",
  "opted_out",
  "blocked",
];

export const WHATSAPP_OPT_IN_STATUSES = ["unknown", "opted_in", "not_opted_in", "opted_out"];

const platformOutreachProspectSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    whatsappNumber: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    sourceUrl: { type: String, required: true, trim: true },
    sourceType: { type: String, trim: true, default: "public-source" },
    tags: { type: [String], default: [] },
    status: { type: String, enum: PLATFORM_OUTREACH_PROSPECT_STATUSES, default: "new" },
    emailOptOut: { type: Boolean, default: false },
    whatsappOptInStatus: { type: String, enum: WHATSAPP_OPT_IN_STATUSES, default: "unknown" },
    whatsappOptInSource: { type: String, trim: true, default: "" },
    lastContactedAt: { type: Date, default: null },
    lastReplyAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

platformOutreachProspectSchema.index({ email: 1 }, { sparse: true });
platformOutreachProspectSchema.index({ whatsappNumber: 1 }, { sparse: true });
platformOutreachProspectSchema.index({ website: 1 }, { sparse: true });
platformOutreachProspectSchema.index({ status: 1, updatedAt: -1 });

const PlatformOutreachProspect =
  mongoose.models.PlatformOutreachProspect ||
  mongoose.model("PlatformOutreachProspect", platformOutreachProspectSchema);

export default PlatformOutreachProspect;
