import mongoose from "mongoose";

const emailProviderConnectionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["gmail", "outlook", "imap", "resend"],
      required: true,
    },
    connectionType: {
      type: String,
      enum: ["mailbox", "delivery"],
      default: "mailbox",
    },
    label: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "connected", "disconnected", "error"],
      default: "draft",
    },
    authMode: {
      type: String,
      enum: ["oauth", "api_key", "password"],
      default: "oauth",
    },
    accountIdentifier: {
      type: String,
      trim: true,
      default: "",
    },
    scopes: {
      type: [String],
      default: [],
    },
    encryptedAccessToken: {
      type: String,
      default: "",
    },
    encryptedRefreshToken: {
      type: String,
      default: "",
    },
    encryptedApiKey: {
      type: String,
      default: "",
    },
    tokenExpiresAt: {
      type: Date,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    syncCursor: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

emailProviderConnectionSchema.index(
  { tenantId: 1, provider: 1, label: 1 },
  { unique: true }
);

const EmailProviderConnection = mongoose.model(
  "EmailProviderConnection",
  emailProviderConnectionSchema
);
export default EmailProviderConnection;
