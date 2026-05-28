import mongoose from "mongoose";

const platformOutreachThreadSchema = new mongoose.Schema(
  {
    prospectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformOutreachProspect",
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformOutreachCampaign",
      default: null,
      index: true,
    },
    channel: { type: String, enum: ["email", "whatsapp"], required: true },
    participantAddress: { type: String, trim: true, required: true },
    status: {
      type: String,
      enum: ["open", "qualified", "needs_review", "closed", "opted_out"],
      default: "open",
    },
    lastMessageAt: { type: Date, default: null },
    messages: { type: [mongoose.Schema.Types.Mixed], default: [] },
    agentState: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

platformOutreachThreadSchema.index({ prospectId: 1, channel: 1 }, { unique: false });

const PlatformOutreachThread =
  mongoose.models.PlatformOutreachThread ||
  mongoose.model("PlatformOutreachThread", platformOutreachThreadSchema);

export default PlatformOutreachThread;
