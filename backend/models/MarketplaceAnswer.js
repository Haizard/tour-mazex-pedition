import mongoose from "mongoose";

const marketplaceAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketplaceQuestion",
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    authorType: {
      type: String,
      enum: ["operator", "admin"],
      required: true,
    },
    authorReference: { type: String, default: "" },
    answerBody: { type: String, required: true, trim: true },
    pinned: { type: Boolean, default: false },
    accepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

marketplaceAnswerSchema.index({ questionId: 1, createdAt: 1 });

const MarketplaceAnswer =
  mongoose.models.MarketplaceAnswer ||
  mongoose.model("MarketplaceAnswer", marketplaceAnswerSchema);

export default MarketplaceAnswer;
