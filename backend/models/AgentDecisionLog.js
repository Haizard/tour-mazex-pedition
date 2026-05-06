import mongoose from "mongoose";

const agentDecisionLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ["decision", "recommended-action"],
      default: "decision",
      index: true,
    },
    sourceType: {
      type: String,
      trim: true,
      default: "unknown",
      index: true,
    },
    sourceId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    inboxItemId: {
      type: String,
      trim: true,
      default: "",
    },
    channel: {
      type: String,
      trim: true,
      default: "website",
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    contactName: {
      type: String,
      trim: true,
      default: "",
    },
    contactAddress: {
      type: String,
      trim: true,
      default: "",
    },
    preview: {
      type: String,
      trim: true,
      default: "",
    },
    leadSource: {
      type: String,
      trim: true,
      default: "",
    },
    conversionStage: {
      type: String,
      trim: true,
      default: "",
    },
    primaryAgent: {
      type: String,
      trim: true,
      default: "crm-lead-agent",
      index: true,
    },
    nextAction: {
      type: String,
      trim: true,
      default: "score-and-route-lead",
    },
    leadScore: {
      type: Number,
      default: 0,
    },
    leadTemperature: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "cold",
      index: true,
    },
    priority: {
      type: String,
      enum: ["urgent", "review", "normal", "low"],
      default: "low",
      index: true,
    },
    status: {
      type: String,
      enum: ["recommended", "accepted", "completed", "dismissed"],
      default: "recommended",
      index: true,
    },
    actionType: {
      type: String,
      trim: true,
      default: "",
    },
    actionLabel: {
      type: String,
      trim: true,
      default: "",
    },
    actionDescription: {
      type: String,
      trim: true,
      default: "",
    },
    actionUrgency: {
      type: String,
      enum: ["high", "normal", "low", ""],
      default: "",
    },
    actionIndex: {
      type: Number,
      default: 0,
    },
    actionKey: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    operatorNote: {
      type: String,
      trim: true,
      default: "",
    },
    guardrails: {
      type: [String],
      default: [],
    },
    decisionSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    decisionHash: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    decidedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

agentDecisionLogSchema.index({ tenantId: 1, sourceType: 1, sourceId: 1, decidedAt: -1 });
agentDecisionLogSchema.index(
  { tenantId: 1, decisionHash: 1, actionKey: 1 },
  { unique: true, partialFilterExpression: { actionKey: { $type: "string", $gt: "" } } }
);

const AgentDecisionLog =
  mongoose.models.AgentDecisionLog ||
  mongoose.model("AgentDecisionLog", agentDecisionLogSchema);

export default AgentDecisionLog;
