import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const coordinatesSchema = new mongoose.Schema(
  {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  { _id: false }
);

const trustSchema = new mongoose.Schema(
  {
    rating: { type: Number, default: 0, min: 0 },
    reviewCount: { type: Number, default: 0, min: 0 },
    proofSummary: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const hotelSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    partnerAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerAccount",
      default: null,
      index: true,
    },
    hotelName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    destination: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    region: {
      type: String,
      trim: true,
      default: "",
    },
    hotelType: {
      type: String,
      trim: true,
      default: "hotel",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    amenityTags: {
      type: [String],
      default: [],
    },
    roomStyleSummary: {
      type: String,
      trim: true,
      default: "",
    },
    publishedStatus: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    coordinates: {
      type: coordinatesSchema,
      default: () => ({}),
    },
    trust: {
      type: trustSchema,
      default: () => ({}),
    },
    aiHighlights: {
      type: [String],
      default: [],
    },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "hotel-records" }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

hotelSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

const Hotel = mongoose.models.Hotel || mongoose.model("Hotel", hotelSchema);

export default Hotel;

