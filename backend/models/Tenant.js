import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    subdomain: { type: String, trim: true, sparse: true, unique: true },
    customDomains: {
      type: [String],
      default: [],
      set: (domains) =>
        (domains || []).map((domain) => domain.toString().trim().toLowerCase()),
    },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },
    isLegacy: { type: Boolean, default: false },
    features: {
      useNewUi: { type: Boolean, default: false },
      enablePageBuilder: { type: Boolean, default: false },
      enableAiContent: { type: Boolean, default: true },
      enableCustomDomains: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

tenantSchema.index({ customDomains: 1 });

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
