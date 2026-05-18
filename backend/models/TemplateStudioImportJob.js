import mongoose from "mongoose";

const templateStudioImportJobSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformAdmin",
      default: null,
    },
    sourceType: { type: String, required: true, trim: true, default: "snippet" },
    status: {
      type: String,
      enum: ["draft", "processing", "ready", "failed"],
      default: "draft",
    },
    inputPayload: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    detectedAssets: { type: [mongoose.Schema.Types.Mixed], default: [] },
    detectedSections: { type: [mongoose.Schema.Types.Mixed], default: [] },
    bindingSuggestions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    previewSnapshot: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    importErrors: { type: [String], default: [] },
  },
  { timestamps: true }
);

const TemplateStudioImportJob =
  mongoose.models.TemplateStudioImportJob ||
  mongoose.model("TemplateStudioImportJob", templateStudioImportJobSchema);

export default TemplateStudioImportJob;
