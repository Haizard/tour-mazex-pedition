import mongoose from "mongoose";

const childLinkSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    label: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    label: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    itemType: {
      type: String,
      required: true,
      enum: ["link", "dropdown", "megamenu"],
      default: "link",
    },
    categoryKey: { type: String, trim: true },
    menuTitle: { type: String, trim: true },
    imageKey: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    children: { type: [childLinkSchema], default: [] },
  },
  { timestamps: true }
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;
