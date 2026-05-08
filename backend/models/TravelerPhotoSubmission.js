import mongoose from "mongoose";

const travelerPhotoSubmissionSchema = new mongoose.Schema(
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
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketplaceReview",
      default: null,
    },
    mediaUrl: { type: String, required: true, trim: true },
    caption: { type: String, trim: true, default: "" },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

travelerPhotoSubmissionSchema.index({ tenantId: 1, tourId: 1, createdAt: -1 });

const TravelerPhotoSubmission =
  mongoose.models.TravelerPhotoSubmission ||
  mongoose.model("TravelerPhotoSubmission", travelerPhotoSubmissionSchema);

export default TravelerPhotoSubmission;
