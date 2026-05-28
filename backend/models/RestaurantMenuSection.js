import mongoose from "mongoose";

const restaurantMenuSectionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "paused", "archived"], default: "active", index: true },
  },
  { timestamps: true }
);

restaurantMenuSectionSchema.index({ tenantId: 1, restaurantId: 1, displayOrder: 1 });

const RestaurantMenuSection =
  mongoose.models.RestaurantMenuSection ||
  mongoose.model("RestaurantMenuSection", restaurantMenuSectionSchema);

export default RestaurantMenuSection;
