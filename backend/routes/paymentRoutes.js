import express from "express";
import Booking from "../models/Booking.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import {
  buildPublicPaymentCheckoutUrl,
  summarizePaymentTransaction,
} from "../utils/paymentAutomation.js";
import { buildTenantFilter, resolveTenantBaseUrl, withTenantId } from "../utils/tenantContext.js";

const router = express.Router();

const applyPaymentStatusTimestamps = (current = {}, updates = {}) => {
  const next = { ...updates };

  if (updates.status === "paid" && current.status !== "paid") {
    next.paidAt = new Date();
  }

  if (updates.status === "failed" && current.status !== "failed") {
    next.failedAt = new Date();
  }

  if (updates.status === "cancelled" && current.status !== "cancelled") {
    next.cancelledAt = new Date();
  }

  return next;
};

router.get("/checkout/:token", async (req, res) => {
  try {
    const payment = await PaymentTransaction.findOne({ publicToken: req.params.token })
      .populate("bookingId", "name packageTour travelDate")
      .lean();

    if (!payment) {
      return res.status(404).json({ message: "Payment link not found." });
    }

    res.status(200).json({
      ...payment,
      paymentSummary: summarizePaymentTransaction(payment),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/checkout/:token/respond", async (req, res) => {
  try {
    const requestedStatus = req.body.status;
    const allowedStatuses = new Set(["paid", "failed", "cancelled"]);

    if (!allowedStatuses.has(requestedStatus)) {
      return res.status(400).json({ message: "Unsupported payment response status." });
    }

    const payment = await PaymentTransaction.findOne({ publicToken: req.params.token });

    if (!payment) {
      return res.status(404).json({ message: "Payment link not found." });
    }

    const updates = applyPaymentStatusTimestamps(payment.toObject(), {
      status: requestedStatus,
    });

    Object.assign(payment, updates);
    await payment.save();

    res.status(200).json({
      ...payment.toObject(),
      paymentSummary: summarizePaymentTransaction(payment.toObject()),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

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
      publicToken: req.body.publicToken,
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
    const baseUrl = resolveTenantBaseUrl(req);
    payload.checkoutUrl =
      payload.checkoutUrl ||
      buildPublicPaymentCheckoutUrl(baseUrl, payload.publicToken);

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
      publicToken: req.body.publicToken,
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

    const paymentBeforeUpdate = await PaymentTransaction.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!paymentBeforeUpdate) {
      return res.status(404).json({ message: "Payment transaction not found" });
    }

    const nextUpdates = applyPaymentStatusTimestamps(paymentBeforeUpdate, updates);

    if (
      (nextUpdates.checkoutUrl === undefined || nextUpdates.checkoutUrl === "") &&
      paymentBeforeUpdate.publicToken
    ) {
      nextUpdates.checkoutUrl = buildPublicPaymentCheckoutUrl(
        resolveTenantBaseUrl(req),
        nextUpdates.publicToken || paymentBeforeUpdate.publicToken
      );
    }

    const payment = await PaymentTransaction.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: nextUpdates },
      { new: true }
    ).lean();

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
