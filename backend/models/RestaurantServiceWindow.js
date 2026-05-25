import mongoose from "mongoose";

const restaurantServiceWindowSchema = new mongoose.Schema(
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
    serviceType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "brunch", "private-dining", "event-dining", "custom"],
      default: "custom",
    },
    defaultStartTime: { type: String, trim: true, default: "" },
    defaultEndTime: { type: String, trim: true, default: "" },
    capacityMode: {
      type: String,
      enum: ["table_type", "seat_count", "on_request"],
      default: "table_type",
    },
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

restaurantServiceWindowSchema.index({ tenantId: 1, restaurantId: 1, status: 1 });

const RestaurantServiceWindow =
  mongoose.models.RestaurantServiceWindow ||
  mongoose.model("RestaurantServiceWindow", restaurantServiceWindowSchema);

export default RestaurantServiceWindow;
