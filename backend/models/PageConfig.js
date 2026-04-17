import mongoose from "mongoose";

const pageSectionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    variant: { type: String, default: "default", trim: true },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    dataConfig: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    styleConfig: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    contentConfig: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: true }
);

const pageConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    pageType: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      keywords: { type: [String], default: [] },
    },
    sections: { type: [pageSectionSchema], default: [] },
  },
  { timestamps: true }
);

pageConfigSchema.index({ tenantId: 1, pageType: 1 }, { unique: true });
pageConfigSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

const PageConfig = mongoose.model("PageConfig", pageConfigSchema);
export default PageConfig;
