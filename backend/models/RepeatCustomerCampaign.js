import mongoose from "mongoose";

const repeatCustomerCampaignSchema = new mongoose.Schema(
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
    campaignType: {
      type: String,
      enum: ["referral", "anniversary", "retargeting"],
      required: true,
      index: true,
    },
    audienceTag: { type: String, default: "" },
    offerLabel: { type: String, default: "" },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "converted", "archived"],
      default: "draft",
      index: true,
    },
    recommendedSendAtLabel: { type: String, default: "" },
    nextStepChecklist: {
      type: [String],
      default: [],
    },
    sentAt: { type: Date, default: null },
    convertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const RepeatCustomerCampaign =
  mongoose.models.RepeatCustomerCampaign ||
  mongoose.model("RepeatCustomerCampaign", repeatCustomerCampaignSchema);

export default RepeatCustomerCampaign;
