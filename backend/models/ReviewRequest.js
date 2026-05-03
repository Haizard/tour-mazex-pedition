import mongoose from "mongoose";

const reviewPlatformSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["google", "tripadvisor", "booking-com", "custom"],
      required: true,
    },
    label: { type: String, required: true },
    reviewUrl: { type: String, default: "" },
  },
  { _id: false }
);

const reviewRequestSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
      required: true,
    },
    guestName: { type: String, required: true, trim: true },
    guestEmail: { type: String, required: true, trim: true, lowercase: true },
    bookingLabel: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "completed", "skipped"],
      default: "draft",
      index: true,
    },
    platforms: {
      type: [reviewPlatformSchema],
      default: [],
    },
    sendWindowLabel: { type: String, default: "" },
    nextStepChecklist: {
      type: [String],
      default: [],
    },
    sentAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const ReviewRequest =
  mongoose.models.ReviewRequest ||
  mongoose.model("ReviewRequest", reviewRequestSchema);

export default ReviewRequest;
