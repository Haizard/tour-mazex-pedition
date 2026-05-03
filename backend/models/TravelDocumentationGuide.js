import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const travelDocumentationGuideSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    market: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    requirementSummary: {
      type: String,
      trim: true,
      default: "",
    },
    sourceLabel: {
      type: String,
      trim: true,
      default: "",
    },
    lastReviewedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "travel-documentation-guides" }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const TravelDocumentationGuide =
  mongoose.models.TravelDocumentationGuide ||
  mongoose.model("TravelDocumentationGuide", travelDocumentationGuideSchema);

export default TravelDocumentationGuide;
