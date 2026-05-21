import mongoose from "mongoose";

const hotelPartnerAdminSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    hotelIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
      },
    ],
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      default: "Hotel Partner Admin",
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordSalt: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["hotel-owner", "hotel-manager"],
      default: "hotel-owner",
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

hotelPartnerAdminSchema.index({ tenantId: 1, username: 1 }, { unique: true });
hotelPartnerAdminSchema.index({ tenantId: 1, hotelIds: 1 });

const HotelPartnerAdmin = mongoose.model("HotelPartnerAdmin", hotelPartnerAdminSchema);
export default HotelPartnerAdmin;
