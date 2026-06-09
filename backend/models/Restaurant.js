import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const restaurantSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    partnerAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerAccount",
      default: null,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    summary: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    destination: { type: String, trim: true, default: "" },
    region: { type: String, trim: true, default: "" },
    geo: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    cuisineTypes: { type: [String], default: [] },
    mealTypes: { type: [String], default: [] },
    dietaryFits: { type: [String], default: [] },
    ambianceTags: { type: [String], default: [] },
    openingHoursSummary: { type: String, trim: true, default: "" },
    reservationStyleSummary: { type: String, trim: true, default: "" },
    restaurantCheckout: {
      enabled: { type: Boolean, default: false },
      depositMode: {
        type: String,
        enum: ["none", "fixed", "percentage", "custom-only"],
        default: "none",
      },
      depositAmount: { type: Number, min: 0, default: 0 },
      depositPercentage: { type: Number, min: 0, max: 100, default: 0 },
      currency: { type: String, trim: true, default: "USD" },
      paymentInstructions: { type: String, trim: true, default: "" },
      autoDeposit: { type: Boolean, default: false },
    },
    photos: { type: [String], default: [] },
    averageRating: { type: Number, min: 0, max: 5, default: null },
    reviewCount: { type: Number, min: 0, default: 0 },
    trustSummary: { type: String, trim: true, default: "" },
    published: { type: Boolean, default: false },
    marketplaceVisible: { type: Boolean, default: false },
    sponsoredPlacement: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
    },
    sourceMeta: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "restaurants" }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

restaurantSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
restaurantSchema.index({ marketplaceVisible: 1, published: 1, destination: 1 });

const Restaurant =
  mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
