import mongoose from "mongoose";

const restaurantMenuItemSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "RestaurantMenuSection", default: null, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, default: "USD" },
    dietaryTags: { type: [String], default: [] },
    allergenTags: { type: [String], default: [] },
    photo: { type: String, trim: true, default: "" },
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    groupFriendly: { type: Boolean, default: false },
    preorderEnabled: { type: Boolean, default: false },
    minGuests: { type: Number, min: 1, default: 1 },
    maxGuests: { type: Number, min: 1, default: 1 },
    status: { type: String, enum: ["active", "paused", "archived"], default: "active", index: true },
  },
  { timestamps: true }
);

restaurantMenuItemSchema.index({ tenantId: 1, restaurantId: 1, featured: -1, status: 1 });
restaurantMenuItemSchema.index({ tenantId: 1, restaurantId: 1, groupFriendly: -1, status: 1 });

const RestaurantMenuItem =
  mongoose.models.RestaurantMenuItem ||
  mongoose.model("RestaurantMenuItem", restaurantMenuItemSchema);

export default RestaurantMenuItem;
