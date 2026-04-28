import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const partnerAccountSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      required: true,
    },
    partnerType: {
      type: String,
      enum: ["hotel", "agency", "supplier"],
      required: true,
      default: "hotel",
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    serviceFocus: {
      type: String,
      trim: true,
      default: "",
    },
    contractLabel: {
      type: String,
      trim: true,
      default: "",
    },
    payoutTerms: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "pending",
    },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "partner-contracts-and-attribution" }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const PartnerAccount =
  mongoose.models.PartnerAccount ||
  mongoose.model("PartnerAccount", partnerAccountSchema);

export default PartnerAccount;
