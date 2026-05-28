import mongoose from "mongoose";

const platformSocialPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    platforms: [{ type: String, enum: ["facebook", "instagram"], required: true }],
    caption: { type: String, required: true, trim: true },
    hashtags: { type: [String], default: [] },
    imageUrls: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "scheduled", "published", "failed"], default: "draft" },
    scheduledFor: { type: Date, default: null, index: true },
    publishResult: { type: mongoose.Schema.Types.Mixed, default: null },
    lastError: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformAdmin", default: null },
  },
  { timestamps: true }
);

platformSocialPostSchema.path("platforms").validate(
  (value) => Array.isArray(value) && value.length > 0,
  "At least one social platform is required."
);

const PlatformSocialPost =
  mongoose.models.PlatformSocialPost || mongoose.model("PlatformSocialPost", platformSocialPostSchema);

export default PlatformSocialPost;
