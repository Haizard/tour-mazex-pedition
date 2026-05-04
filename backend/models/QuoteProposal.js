import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const quoteLineItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1 },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const quoteProposalSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    inquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomInquiry",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    travelerName: { type: String, trim: true, default: "" },
    destinationLabel: { type: String, trim: true, default: "" },
    summary: { type: String, trim: true, default: "" },
    currency: { type: String, trim: true, default: "USD" },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "expired", "rejected"],
      default: "draft",
    },
    travelerCount: { type: Number, default: 1, min: 1 },
    tripLengthDays: { type: Number, default: 0, min: 0 },
    lineItems: {
      type: [quoteLineItemSchema],
      default: [],
    },
    subtotal: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    recommendedTourIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "TourPackage",
      default: [],
    },
    itineraryOutline: {
      type: [String],
      default: [],
    },
    nextSteps: {
      type: [String],
      default: [],
    },
    validUntil: { type: Date, default: null },
    generatedBy: { type: String, default: "" },
    generationMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    publicToken: {
      type: String,
      unique: true,
      index: true,
    },
    travelerNotes: {
      type: String,
      trim: true,
      default: "",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    conversionStage: {
      type: String,
      enum: ["draft", "sent", "accepted", "converted", "expired", "rejected"],
      default: "draft",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["not-started", "pending", "paid", "failed", "cancelled", "refunded"],
      default: "not-started",
      index: true,
    },
    sentAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    lastPaymentAt: { type: Date, default: null },
    pdfMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    pdfGeneratedAt: { type: Date, default: null },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "quotes" }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

quoteProposalSchema.pre("save", function (next) {
  if (!this.publicToken) {
    this.publicToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }
  next();
});

const QuoteProposal = mongoose.model("QuoteProposal", quoteProposalSchema);
export default QuoteProposal;
