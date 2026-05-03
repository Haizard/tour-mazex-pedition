import mongoose from "mongoose";

const whatsappTemplateSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: { type: String, required: true, index: true },
    category: { type: String, default: "UTILITY" },
    language: { type: String, default: "en_US" },
    components: [
      {
        type: { type: String, enum: ["HEADER", "BODY", "FOOTER", "BUTTONS"] },
        format: { type: String }, // TEXT, IMAGE, DOCUMENT
        text: { type: String },
        buttons: [
          {
            type: { type: String, enum: ["QUICK_REPLY", "URL", "PHONE_NUMBER"] },
            text: { type: String },
            url: { type: String },
            phoneNumber: { type: String },
          },
        ],
      },
    ],
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "DRAFT",
    },
  },
  { timestamps: true }
);

// Ensure unique template names per tenant
whatsappTemplateSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const WhatsAppTemplate =
  mongoose.models.WhatsAppTemplate ||
  mongoose.model("WhatsAppTemplate", whatsappTemplateSchema);

export default WhatsAppTemplate;
