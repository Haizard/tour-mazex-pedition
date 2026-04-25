import mongoose from "mongoose";
import crypto from "crypto";

const travelerFeedbackSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5 },
    privateNote: { type: String },
    publicToken: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["pending", "submitted"],
      default: "pending",
    },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

const TravelerFeedback =
  mongoose.models.TravelerFeedback ||
  mongoose.model("TravelerFeedback", travelerFeedbackSchema);

export default TravelerFeedback;
