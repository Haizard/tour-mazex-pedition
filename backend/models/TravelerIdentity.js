import mongoose from "mongoose";

const travelerIdentitySchema = new mongoose.Schema(
  {
    sessionKey: { type: String, index: true, trim: true, default: "" },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },
    verificationState: {
      type: String,
      enum: ["guest", "verified-inquiry", "verified-booking"],
      default: "guest",
    },
    linkedInquiryIds: [{ type: String }],
    linkedBookingIds: [{ type: String }],
    futureAccountId: { type: String, default: "" },
  },
  { timestamps: true }
);

travelerIdentitySchema.index({ sessionKey: 1, email: 1 }, { unique: true, sparse: true });

const TravelerIdentity =
  mongoose.models.TravelerIdentity ||
  mongoose.model("TravelerIdentity", travelerIdentitySchema);

export default TravelerIdentity;
