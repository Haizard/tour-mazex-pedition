import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const hotelSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      required: true,
    },
    partnerAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerAccount",
      default: null,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    summary: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    destination: { type: String, trim: true, default: "" },
    region: { type: String, trim: true, default: "" },
    geo: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    accommodationType: { type: String, trim: true, default: "hotel" },
    amenities: { type: [String], default: [] },
    roomStyleSummary: { type: String, trim: true, default: "" },
    photos: { type: [String], default: [] },
    averageRating: { type: Number, min: 0, max: 5, default: null },
    reviewCount: { type: Number, min: 0, default: 0 },
    trustSummary: { type: String, trim: true, default: "" },
    published: { type: Boolean, default: false },
    marketplaceVisible: { type: Boolean, default: false },
    sponsoredPlacement: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
    },
    sourceMeta: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    pendingPartnerUpdate: {
      status: {
        type: String,
        enum: ["none", "pending-review", "approved", "rejected"],
        default: "none",
      },
      payload: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({}),
      },
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HotelPartnerAdmin",
        default: null,
      },
      submittedAt: {
        type: Date,
        default: null,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TenantAdmin",
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      reviewNote: {
        type: String,
        trim: true,
        default: "",
      },
    },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "hotels" }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

hotelSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
hotelSchema.index({ marketplaceVisible: 1, published: 1, destination: 1 });

const Hotel = mongoose.models.Hotel || mongoose.model("Hotel", hotelSchema);

export default Hotel;
