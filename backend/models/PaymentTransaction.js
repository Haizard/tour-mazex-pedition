import mongoose from "mongoose";

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
    customerName: {
      type: String,
      trim: true,
      default: "",
    },
    provider: {
      type: String,
      enum: ["stripe", "paypal", "manual"],
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
    checkoutUrl: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const PaymentTransaction =
  mongoose.models.PaymentTransaction ||
  mongoose.model("PaymentTransaction", paymentTransactionSchema);

export default PaymentTransaction;
