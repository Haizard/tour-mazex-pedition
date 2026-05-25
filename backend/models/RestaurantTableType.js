import mongoose from "mongoose";

const restaurantTableTypeSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    label: { type: String, required: true, trim: true },
    minGuests: { type: Number, min: 1, default: 1 },
    maxGuests: { type: Number, min: 1, default: 2 },
    quantity: { type: Number, min: 0, default: 1 },
    status: {
      type: String,
      enum: ["active", "paused", "archived"],
      default: "active",
      index: true,
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

restaurantTableTypeSchema.index({ tenantId: 1, restaurantId: 1, status: 1 });

const RestaurantTableType =
  mongoose.models.RestaurantTableType ||
  mongoose.model("RestaurantTableType", restaurantTableTypeSchema);

export default RestaurantTableType;
