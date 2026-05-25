import mongoose from "mongoose";

const restaurantPartnerAdminSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    restaurantIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
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
      default: "Restaurant Partner Admin",
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
      enum: ["restaurant-owner", "restaurant-manager"],
      default: "restaurant-owner",
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

restaurantPartnerAdminSchema.index({ tenantId: 1, username: 1 }, { unique: true });
restaurantPartnerAdminSchema.index({ tenantId: 1, restaurantIds: 1 });

const RestaurantPartnerAdmin =
  mongoose.models.RestaurantPartnerAdmin ||
  mongoose.model("RestaurantPartnerAdmin", restaurantPartnerAdminSchema);

export default RestaurantPartnerAdmin;
