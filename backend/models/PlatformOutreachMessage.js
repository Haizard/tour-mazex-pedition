import mongoose from "mongoose";

const platformOutreachMessageSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformOutreachCampaign",
      default: null,
      index: true,
    },
    prospectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformOutreachProspect",
      default: null,
      index: true,
    },
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformOutreachThread",
      default: null,
      index: true,
    },
    channel: { type: String, enum: ["email", "whatsapp"], required: true, index: true },
    direction: { type: String, enum: ["outbound", "inbound"], required: true },
    subject: { type: String, trim: true, default: "" },
    body: { type: String, required: true, trim: true },
    llmGenerationMeta: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["draft", "queued", "sent", "delivered", "failed", "replied", "opted_out", "escalated"],
      default: "draft",
      index: true,
    },
    providerMessageId: { type: String, trim: true, default: "" },
    providerError: { type: String, trim: true, default: "" },
    scheduledFor: { type: Date, default: null, index: true },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const PlatformOutreachMessage =
  mongoose.models.PlatformOutreachMessage ||
  mongoose.model("PlatformOutreachMessage", platformOutreachMessageSchema);

export default PlatformOutreachMessage;
