import mongoose from "mongoose";

const reusableSectionTemplateSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "general" },
    previewImage: { type: String, trim: true, default: "" },
    sectionType: { type: String, required: true, trim: true },
    sourceType: { type: String, trim: true, default: "reusable" },
    defaultContent: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    defaultStyles: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    supportedBindings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    sourceMeta: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

const ReusableSectionTemplate =
  mongoose.models.ReusableSectionTemplate ||
  mongoose.model("ReusableSectionTemplate", reusableSectionTemplateSchema);

export default ReusableSectionTemplate;
