import mongoose from "mongoose";

const platformOutreachSettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: "platform-outreach", unique: true },
    email: {
      senderName: { type: String, trim: true, default: "" },
      senderEmail: { type: String, trim: true, lowercase: true, default: "" },
      postalAddress: { type: String, trim: true, default: "" },
      unsubscribeBaseUrl: { type: String, trim: true, default: "" },
      webhookSecret: { type: String, trim: true, default: "" },
      signatureSecret: { type: String, trim: true, default: "" },
    },
    whatsapp: {
      businessAccountId: { type: String, trim: true, default: "" },
      phoneNumberId: { type: String, trim: true, default: "" },
      defaultMarketingTemplateName: { type: String, trim: true, default: "" },
      webhookVerifyToken: { type: String, trim: true, default: "" },
      appSecret: { type: String, trim: true, default: "" },
    },
    attribution: {
      webhookSecret: { type: String, trim: true, default: "" },
    },
    social: {
      facebookPageId: { type: String, trim: true, default: "" },
      instagramBusinessAccountId: { type: String, trim: true, default: "" },
    },
    rateLimits: {
      maxEmailPerHour: { type: Number, min: 1, default: 50 },
      maxWhatsAppPerHour: { type: Number, min: 1, default: 20 },
      maxSocialPostsPerDay: { type: Number, min: 1, default: 10 },
    },
    escalationRules: {
      type: [
        {
          label: { type: String, trim: true, required: true },
          keywords: { type: [String], default: [] },
          enabled: { type: Boolean, default: true },
          minConfidence: { type: Number, min: 0, max: 1, default: 0.65 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const PlatformOutreachSettings =
  mongoose.models.PlatformOutreachSettings ||
  mongoose.model("PlatformOutreachSettings", platformOutreachSettingsSchema);

export default PlatformOutreachSettings;
