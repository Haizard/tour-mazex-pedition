import mongoose from "mongoose";

const hotelClaimRequestSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      default: null,
      index: true,
    },
    hotelNameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    destinationSnapshot: {
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
      enum: ["hotel-owner", "hotel-manager"],
      default: "hotel-owner",
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
    requestedUsername: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordSalt: {
      type: String,
      required: true,
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
      ref: "HotelPartnerAdmin",
      default: null,
    },
    proposedHotelPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  { timestamps: true }
);

hotelClaimRequestSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
hotelClaimRequestSchema.index({ claimantEmail: 1, createdAt: -1 });

const HotelClaimRequest =
  mongoose.models.HotelClaimRequest ||
  mongoose.model("HotelClaimRequest", hotelClaimRequestSchema);

export default HotelClaimRequest;
