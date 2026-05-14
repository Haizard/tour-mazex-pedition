import mongoose from "mongoose";

const EMAIL_AUDIENCE_STATUSES = ["subscribed", "unsubscribed", "suppressed"];

const emailAudienceContactSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      trim: true,
      default: "manual",
    },
    status: {
      type: String,
      enum: EMAIL_AUDIENCE_STATUSES,
      default: "subscribed",
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
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

emailAudienceContactSchema.index({ tenantId: 1, email: 1 }, { unique: true });

const EmailAudienceContact =
  mongoose.models.EmailAudienceContact ||
  mongoose.model("EmailAudienceContact", emailAudienceContactSchema);

export { EMAIL_AUDIENCE_STATUSES };
export default EmailAudienceContact;
