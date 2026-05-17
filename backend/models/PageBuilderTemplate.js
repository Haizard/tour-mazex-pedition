import mongoose from "mongoose";

const pageBuilderTemplateSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    pageType: { type: String, required: true, trim: true, default: "home" },
    priceLabel: { type: String, required: true, trim: true, default: "$149" },
    purchaseStatus: {
      type: String,
      enum: ["available", "included", "purchased"],
      default: "available",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    previewImage: { type: String, trim: true, default: "" },
    preview: { type: String, required: true, trim: true },
    bestFor: { type: [String], default: [] },
    featuredRank: { type: Number, default: 50 },
    releaseOrder: { type: Number, default: 100 },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      keywords: { type: [String], default: [] },
    },
    sections: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformAdmin", default: null },
  },
  { timestamps: true }
);

const PageBuilderTemplate = mongoose.model("PageBuilderTemplate", pageBuilderTemplateSchema);
export default PageBuilderTemplate;
