import mongoose from "mongoose";

export const PLATFORM_OUTREACH_CHANNELS = ["email", "whatsapp", "facebook", "instagram"];
export const PLATFORM_OUTREACH_CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "completed",
];

const platformOutreachCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    objective: { type: String, required: true, trim: true },
    audienceFilters: { type: mongoose.Schema.Types.Mixed, default: {} },
    channels: [{ type: String, enum: PLATFORM_OUTREACH_CHANNELS, required: true }],
    tone: { type: String, trim: true, default: "professional, helpful, direct" },
    offer: { type: String, trim: true, default: "" },
    status: { type: String, enum: PLATFORM_OUTREACH_CAMPAIGN_STATUSES, default: "draft" },
    schedule: { type: mongoose.Schema.Types.Mixed, default: {} },
    followUpCadence: { type: [String], default: [] },
    complianceProfile: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformAdmin", default: null },
  },
  { timestamps: true }
);

platformOutreachCampaignSchema.path("channels").validate(
  (value) => Array.isArray(value) && value.length > 0,
  "At least one outreach channel is required."
);

const PlatformOutreachCampaign =
  mongoose.models.PlatformOutreachCampaign ||
  mongoose.model("PlatformOutreachCampaign", platformOutreachCampaignSchema);

export default PlatformOutreachCampaign;
