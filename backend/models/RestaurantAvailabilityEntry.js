import mongoose from "mongoose";

const restaurantAvailabilityEntrySchema = new mongoose.Schema(
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
    serviceWindowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantServiceWindow",
      default: null,
      index: true,
    },
    tableTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantTableType",
      default: null,
      index: true,
    },
    date: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: ["open", "limited", "sold_out", "on_request", "closed"],
      default: "on_request",
      index: true,
    },
    availableUnits: { type: Number, min: 0, default: 0 },
    availableSeats: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

restaurantAvailabilityEntrySchema.index({
  tenantId: 1,
  restaurantId: 1,
  date: 1,
  serviceWindowId: 1,
  tableTypeId: 1,
});

const RestaurantAvailabilityEntry =
  mongoose.models.RestaurantAvailabilityEntry ||
  mongoose.model("RestaurantAvailabilityEntry", restaurantAvailabilityEntrySchema);

export default RestaurantAvailabilityEntry;
