import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const languageAssistantProfileSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      trim: true,
    },
    localeCode: {
      type: String,
      trim: true,
      default: "",
    },
    tone: {
      type: String,
      trim: true,
      default: "",
    },
    useCases: {
      type: [String],
      default: [],
    },
    glossary: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused"],
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
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "language-assistant-profiles" }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const LanguageAssistantProfile =
  mongoose.models.LanguageAssistantProfile ||
  mongoose.model("LanguageAssistantProfile", languageAssistantProfileSchema);

export default LanguageAssistantProfile;
