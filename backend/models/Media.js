import { Buffer } from "node:buffer";
import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const mediaSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    data: {
      type: Buffer,
      default: null,
    },
    size: {
      type: Number,
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ["mongo-inline", "s3-compatible"],
      default: "mongo-inline",
      index: true,
    },
    storageKey: {
      type: String,
      default: "",
      trim: true,
    },
    storageBucket: {
      type: String,
      default: "",
      trim: true,
    },
    storageEndpoint: {
      type: String,
      default: "",
      trim: true,
    },
    publicUrl: {
      type: String,
      default: "",
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformAdmin",
    },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({
          entityKey: "media-assets",
          targetOwner: "s3-compatible",
          migrationMode: "shadow-prep",
        }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const Media = mongoose.model("Media", mediaSchema);
export default Media;
