import mongoose from "mongoose";

const CAMPAIGN_TYPES = ["seasonal", "migration", "holiday", "custom"];
const CAMPAIGN_STATUSES = ["draft", "scheduled", "active", "completed"];
const CAMPAIGN_CHANNELS = ["instagram", "facebook", "email", "whatsapp"];

const campaignSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    campaignType: {
      type: String,
      enum: CAMPAIGN_TYPES,
      required: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: CAMPAIGN_STATUSES,
      default: "draft",
    },
    channels: [
      {
        type: String,
        enum: CAMPAIGN_CHANNELS,
        required: true,
      },
    ],
    scheduledFor: {
      type: Date,
      default: null,
    },
    contentBundle: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

campaignSchema.path("channels").validate(
  (value) => Array.isArray(value) && value.length > 0,
  "At least one campaign channel is required."
);

const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

export { CAMPAIGN_CHANNELS, CAMPAIGN_STATUSES, CAMPAIGN_TYPES };
export default Campaign;
