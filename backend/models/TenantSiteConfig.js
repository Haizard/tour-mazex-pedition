import mongoose from "mongoose";

const tenantSiteConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
      index: true,
    },
    homepageConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        pageType: "legacy-home",
        sections: [],
      }),
    },
    navigationConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        ctaLabel: "PLAN MY TRIP",
        ctaHref: "/plan-my-trip",
      }),
    },
    footerConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        copyrightLabel: "",
      }),
    },
    enabledFeatures: {
      type: [String],
      default: ["legacy-ui", "ai-content", "dynamic-menu"],
    },
  },
  { timestamps: true }
);

const TenantSiteConfig = mongoose.model("TenantSiteConfig", tenantSiteConfigSchema);
export default TenantSiteConfig;
