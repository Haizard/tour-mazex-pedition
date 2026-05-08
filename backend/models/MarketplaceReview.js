import mongoose from "mongoose";

const marketplaceReviewSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourPackage",
      required: true,
      index: true,
    },
    travelerIdentityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelerIdentity",
      required: true,
      index: true,
    },
    bookingId: { type: String, default: "" },
    inquiryId: { type: String, default: "" },
    verificationType: {
      type: String,
      enum: ["booking", "inquiry"],
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    headline: { type: String, trim: true, default: "" },
    reviewBody: { type: String, trim: true, default: "" },
    sentimentTags: [{ type: String }],
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    visibilityState: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    travelMonth: { type: String, trim: true, default: "" },
    travelerType: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

marketplaceReviewSchema.index({ tenantId: 1, tourId: 1, createdAt: -1 });

const MarketplaceReview =
  mongoose.models.MarketplaceReview ||
  mongoose.model("MarketplaceReview", marketplaceReviewSchema);

export default MarketplaceReview;
