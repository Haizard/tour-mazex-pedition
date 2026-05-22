import mongoose from "mongoose";
import crypto from "crypto";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const paymentTransactionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    accommodationReservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccommodationReservation",
      default: null,
    },
    customerName: {
      type: String,
      trim: true,
      default: "",
    },
    provider: {
      type: String,
      enum: ["stripe", "pesapal"],
      default: "stripe",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      default: "USD",
    },
    feePercent: {
      type: Number,
      min: 0,
      default: 2.9,
    },
    feeAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    publicToken: {
      type: String,
      unique: true,
      sparse: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    checkoutUrl: {
      type: String,
      trim: true,
      default: "",
    },
    checkoutKind: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    providerReference: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    failureReason: {
      type: String,
      trim: true,
      default: "",
    },
    processedEventIds: {
      type: [String],
      default: [],
    },
    lastWebhookEventId: {
      type: String,
      trim: true,
      default: "",
    },
    lastWebhookAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "payments" }),
        { _id: false }
      ),
      default: () => ({}),
    },
    invoiceMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    invoiceGeneratedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const PaymentTransaction =
  mongoose.models.PaymentTransaction ||
  mongoose.model("PaymentTransaction", paymentTransactionSchema);

export default PaymentTransaction;
