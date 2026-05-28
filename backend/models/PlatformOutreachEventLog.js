import mongoose from "mongoose";

const platformOutreachEventLogSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true, trim: true, index: true },
    prospectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformOutreachProspect",
      default: null,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformOutreachCampaign",
      default: null,
      index: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformOutreachMessage",
      default: null,
      index: true,
    },
    actorType: {
      type: String,
      enum: ["platform-admin", "system", "agent", "provider"],
      default: "system",
    },
    actorId: { type: String, trim: true, default: "" },
    summary: { type: String, trim: true, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const PlatformOutreachEventLog =
  mongoose.models.PlatformOutreachEventLog ||
  mongoose.model("PlatformOutreachEventLog", platformOutreachEventLogSchema);

export default PlatformOutreachEventLog;
