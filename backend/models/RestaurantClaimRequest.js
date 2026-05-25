import mongoose from "mongoose";

const restaurantClaimRequestSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true,
    },
    restaurantNameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    destinationSnapshot: {
      type: String,
      default: "",
      trim: true,
    },
    regionSnapshot: {
      type: String,
      default: "",
      trim: true,
    },
    claimantName: {
      type: String,
      required: true,
      trim: true,
    },
    claimantEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    claimantPhone: {
      type: String,
      default: "",
      trim: true,
    },
    claimantRole: {
      type: String,
      enum: ["restaurant-owner", "restaurant-manager"],
      default: "restaurant-owner",
    },
    proofNote: {
      type: String,
      default: "",
      trim: true,
    },
    proofLinks: {
      type: [String],
      default: [],
    },
    claimType: {
      type: String,
      enum: ["existing-listing", "new-listing-request"],
      default: "existing-listing",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "needs-more-proof"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TenantAdmin",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      default: "",
      trim: true,
    },
    linkedPartnerAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    proposedRestaurantPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  { timestamps: true }
);

restaurantClaimRequestSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
restaurantClaimRequestSchema.index({ claimantEmail: 1, createdAt: -1 });

const RestaurantClaimRequest =
  mongoose.models.RestaurantClaimRequest ||
  mongoose.model("RestaurantClaimRequest", restaurantClaimRequestSchema);

export default RestaurantClaimRequest;
