import express from "express";
import Booking from "../models/Booking.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { summarizePaymentTransaction } from "../utils/paymentAutomation.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("payment-automation"));

router.get("/", async (req, res) => {
  try {
    const payments = await PaymentTransaction.find(buildTenantFilter(req))
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(
      payments.map((payment) => ({
        ...payment,
        paymentSummary: summarizePaymentTransaction(payment),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = withTenantId(req, {
      bookingId: req.body.bookingId || null,
      customerName: req.body.customerName,
      provider: req.body.provider,
      amount: req.body.amount,
      currency: req.body.currency,
      feePercent: req.body.feePercent,
      feeAmount: req.body.feeAmount,
      checkoutUrl: req.body.checkoutUrl,
      status: req.body.status,
      notes: req.body.notes,
    });

    if (payload.bookingId && !payload.customerName) {
      const booking = await Booking.findOne(buildTenantFilter(req, { _id: payload.bookingId })).lean();
      payload.customerName = booking?.name || "";
      payload.amount = payload.amount || booking?.totalPrice || 0;
    }

    const amount = Number(payload.amount || 0);
    const feePercent = Number(payload.feePercent || 0);
    payload.feeAmount = Number(payload.feeAmount || ((amount * feePercent) / 100).toFixed(2));
    payload.checkoutUrl =
      payload.checkoutUrl ||
      `https://checkout.${payload.provider || "stripe"}.example/pay/${Date.now()}`;

    const payment = new PaymentTransaction(payload);
    await payment.save();

    res.status(201).json({
      ...payment.toObject(),
      paymentSummary: summarizePaymentTransaction(payment.toObject()),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updates = {
      bookingId: Object.prototype.hasOwnProperty.call(req.body, "bookingId")
        ? req.body.bookingId || null
        : undefined,
      customerName: req.body.customerName,
      provider: req.body.provider,
      amount: req.body.amount,
      currency: req.body.currency,
      feePercent: req.body.feePercent,
      feeAmount: req.body.feeAmount,
      checkoutUrl: req.body.checkoutUrl,
      status: req.body.status,
      notes: req.body.notes,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    if (updates.amount !== undefined || updates.feePercent !== undefined) {
      const amount = Number(updates.amount || 0);
      const feePercent = Number(updates.feePercent || 0);
      if (updates.feeAmount === undefined) {
        updates.feeAmount = Number(((amount * feePercent) / 100).toFixed(2));
      }
    }

    const payment = await PaymentTransaction.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true }
    ).lean();

    if (!payment) {
      return res.status(404).json({ message: "Payment transaction not found" });
    }

    res.status(200).json({
      ...payment,
      paymentSummary: summarizePaymentTransaction(payment),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const payment = await PaymentTransaction.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!payment) {
      return res.status(404).json({ message: "Payment transaction not found" });
    }

    res.status(200).json({ message: "Payment transaction deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
