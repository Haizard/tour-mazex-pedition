import mongoose from "mongoose";

const tenantPropertyPartnershipSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    propertyType: {
      type: String,
      enum: ["restaurant", "hotel"],
      required: true,
    },
    propertyName: {
      type: String,
      trim: true,
      default: "",
    },
    propertySlug: {
      type: String,
      trim: true,
      default: "",
    },
    ownerTenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
    },
    commissionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    dealNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

tenantPropertyPartnershipSchema.index(
  { tenantId: 1, propertyId: 1, propertyType: 1 },
  { unique: true }
);
tenantPropertyPartnershipSchema.index({ tenantId: 1, status: 1 });
tenantPropertyPartnershipSchema.index({ propertyId: 1, propertyType: 1 });

const TenantPropertyPartnership =
  mongoose.models.TenantPropertyPartnership ||
  mongoose.model("TenantPropertyPartnership", tenantPropertyPartnershipSchema);

export default TenantPropertyPartnership;
