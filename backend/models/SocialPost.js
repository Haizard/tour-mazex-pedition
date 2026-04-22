import mongoose from "mongoose";

const SUPPORTED_PLATFORMS = ["instagram", "facebook"];
const SUPPORTED_STATUSES = ["draft", "scheduled", "ready", "published", "failed"];

const socialPostSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    tourPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourPackage",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    platforms: [
      {
        type: String,
        enum: SUPPORTED_PLATFORMS,
        required: true,
      },
    ],
    status: {
      type: String,
      enum: SUPPORTED_STATUSES,
      default: "draft",
    },
    caption: {
      type: String,
      required: true,
      trim: true,
    },
    hashtags: [
      {
        type: String,
        trim: true,
      },
    ],
    callToAction: {
      type: String,
      trim: true,
      default: "Book your adventure today.",
    },
    imageUrls: [
      {
        type: String,
        trim: true,
      },
    ],
    scheduledFor: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          if (this.status !== "scheduled") {
            return true;
          }

          return Boolean(value);
        },
        message: "A scheduled post must include a schedule date.",
      },
    },
    generationSource: {
      type: String,
      default: "tour-package",
      trim: true,
    },
    generationMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    publishResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    lastError: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

socialPostSchema.path("platforms").validate((value) => Array.isArray(value) && value.length > 0, "At least one platform is required.");

const SocialPost = mongoose.models.SocialPost || mongoose.model("SocialPost", socialPostSchema);

export { SUPPORTED_PLATFORMS, SUPPORTED_STATUSES };
export default SocialPost;
