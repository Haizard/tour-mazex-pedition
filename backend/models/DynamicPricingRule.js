import mongoose from "mongoose";

const dynamicPricingRuleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    ruleName: {
      type: String,
      required: true,
      trim: true,
    },
    routeLabel: {
      type: String,
      trim: true,
      default: "",
    },
    seasonMultiplier: {
      type: Number,
      default: 1,
    },
    demandMultiplier: {
      type: Number,
      default: 1,
    },
    occupancyMultiplier: {
      type: Number,
      default: 1,
    },
    minimumPrice: {
      type: Number,
      default: 0,
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused"],
      default: "draft",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const DynamicPricingRule =
  mongoose.models.DynamicPricingRule ||
  mongoose.model("DynamicPricingRule", dynamicPricingRuleSchema);

export default DynamicPricingRule;
