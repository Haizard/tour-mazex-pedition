import mongoose from "mongoose";

const leadFollowUpSequenceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    inquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomInquiry",
      required: false,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "cancelled"],
      default: "active",
      index: true,
    },
    touchpoints: [
      {
        scheduledAt: { type: Date, required: true },
        channel: { type: String, enum: ["whatsapp", "email"], default: "whatsapp" },
        content: { type: String, required: true },
        status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
        sentAt: { type: Date, default: null },
      },
    ],
  },
  { timestamps: true }
);

const LeadFollowUpSequence =
  mongoose.models.LeadFollowUpSequence ||
  mongoose.model("LeadFollowUpSequence", leadFollowUpSequenceSchema);

export default LeadFollowUpSequence;
