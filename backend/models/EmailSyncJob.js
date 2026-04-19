import mongoose from "mongoose";

const emailSyncJobSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailProviderConnection",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["gmail", "outlook", "imap", "resend"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["pull", "push", "bidirectional"],
      default: "pull",
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    resultSummary: {
      type: String,
      trim: true,
      default: "",
    },
    recordsDiscovered: {
      type: Number,
      default: 0,
    },
    recordsProcessed: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      trim: true,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

emailSyncJobSchema.index({ tenantId: 1, connectionId: 1, createdAt: -1 });

const EmailSyncJob = mongoose.model("EmailSyncJob", emailSyncJobSchema);
export default EmailSyncJob;
