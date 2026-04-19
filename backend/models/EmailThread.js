import mongoose from "mongoose";

const emailThreadSchema = new mongoose.Schema(
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
    providerThreadId: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    participants: {
      type: [String],
      default: [],
      set: (values) => (values || []).map((item) => item.toString().trim().toLowerCase()),
    },
    inquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomInquiry",
      default: null,
    },
    contactMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContactMessage",
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "pending", "closed", "archived"],
      default: "open",
    },
    mailboxFolder: {
      type: String,
      trim: true,
      default: "inbox",
    },
    previewText: {
      type: String,
      trim: true,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    aiDraftStatus: {
      type: String,
      enum: ["none", "drafted", "approved", "sent"],
      default: "none",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

emailThreadSchema.index(
  { tenantId: 1, connectionId: 1, providerThreadId: 1 },
  { unique: true }
);

const EmailThread = mongoose.model("EmailThread", emailThreadSchema);
export default EmailThread;
