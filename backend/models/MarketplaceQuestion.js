import mongoose from "mongoose";

const marketplaceQuestionSchema = new mongoose.Schema(
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
    questionBody: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    answerCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

marketplaceQuestionSchema.index({ tenantId: 1, tourId: 1, createdAt: -1 });

const MarketplaceQuestion =
  mongoose.models.MarketplaceQuestion ||
  mongoose.model("MarketplaceQuestion", marketplaceQuestionSchema);

export default MarketplaceQuestion;
