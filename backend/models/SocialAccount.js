import mongoose from "mongoose";

const PROVIDERS = ["meta", "whatsapp"];
const STATUSES = ["draft", "active", "error", "disabled"];

const socialAccountSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: PROVIDERS,
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "draft",
    },
    accessToken: {
      type: String,
      required: true,
      trim: true,
    },
    pageId: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          if (this.provider !== "meta") {
            return true;
          }
          return Boolean(value);
        },
        message: "Meta accounts require a Facebook Page ID.",
      },
    },
    instagramBusinessAccountId: {
      type: String,
      trim: true,
      default: "",
    },
    whatsappBusinessAccountId: {
      type: String,
      trim: true,
      default: "",
    },
    whatsappPhoneNumberId: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          if (this.provider !== "whatsapp") {
            return true;
          }
          return Boolean(value);
        },
        message: "WhatsApp accounts require a Phone Number ID.",
      },
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const SocialAccount =
  mongoose.models.SocialAccount ||
  mongoose.model("SocialAccount", socialAccountSchema);

export { PROVIDERS, STATUSES };
export default SocialAccount;
