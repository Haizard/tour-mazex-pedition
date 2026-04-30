import express from "express";
import process from "node:process";
import Booking from "../models/Booking.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import {
  buildPublicPaymentCheckoutUrl,
  summarizePaymentTransaction,
} from "../utils/paymentAutomation.js";
import {
  buildPaymentStatusPatch,
  shouldIgnoreWebhookEvent,
} from "../utils/paymentWebhookState.js";
import { buildTenantFilter, resolveTenantBaseUrl, withTenantId } from "../utils/tenantContext.js";
import QuoteProposal from "../models/QuoteProposal.js";
import {
  deleteMongoDocumentFromShadowStore,
  syncMongoDocumentToShadowStore,
} from "../utils/postgresShadowWrites.js";
import {
  buildPublicPaymentRevenueView,
  deletePaymentRevenueRecord,
  findPaymentRevenueRecordByProviderReference,
  findPaymentRevenueRecordByPublicToken,
  syncBookingRevenueRecord,
  syncPaymentRevenueRecord,
  syncQuoteRevenueRecord,
} from "../utils/postgresRevenueRecords.js";
import { fetchPrimaryPayments } from "../utils/postgresPrimaryReads.js";
import { preferPrimaryCollection } from "../utils/postgresReadFallback.js";

const router = express.Router();

const toPaymentResponse = (payment = {}) => ({
  ...payment,
  paymentSummary: summarizePaymentTransaction(payment),
  lifecycle: {
    status: payment.status,
    paidAt: payment.paidAt || null,
    failedAt: payment.failedAt || null,
    cancelledAt: payment.cancelledAt || null,
    refundedAt: payment.refundedAt || null,
    paymentUpdatedAt:
      payment.refundedAt ||
      payment.paidAt ||
      payment.failedAt ||
      payment.cancelledAt ||
      payment.updatedAt ||
      null,
  },
});

const buildBookingPaymentState = (payment = {}) => {
  if (payment.status === "paid") {
    return { paymentStatus: "paid", revenueStage: "paid", paymentRequired: false };
  }

  if (payment.status === "pending") {
    return { paymentStatus: "pending", revenueStage: "awaiting-payment", paymentRequired: true };
  }

  if (payment.status === "failed") {
    return { paymentStatus: "failed", revenueStage: "awaiting-payment", paymentRequired: true };
  }

  if (payment.status === "cancelled") {
    return { paymentStatus: "cancelled", revenueStage: "cancelled", paymentRequired: true };
  }

  if (payment.status === "refunded") {
    return { paymentStatus: "refunded", revenueStage: "cancelled", paymentRequired: true };
  }

  return { paymentStatus: "not-started", revenueStage: "new", paymentRequired: true };
};

const syncLinkedRevenueRecords = async (req, payment = {}) => {
  const paymentTimestamp =
    payment.refundedAt ||
    payment.paidAt ||
    payment.failedAt ||
    payment.cancelledAt ||
    payment.updatedAt ||
    new Date();

  if (payment.bookingId) {
    const bookingPatch = {
      ...buildBookingPaymentState(payment),
      paymentUpdatedAt: paymentTimestamp,
      convertedAt: payment.status === "paid" ? paymentTimestamp : undefined,
    };

    Object.keys(bookingPatch).forEach((key) => bookingPatch[key] === undefined && delete bookingPatch[key]);

    await Booking.findOneAndUpdate(
      buildTenantFilter(req, { _id: payment.bookingId }),
      { $set: bookingPatch }
    );

    const quotePatch = {
      paymentStatus: payment.status || "pending",
      lastPaymentAt: paymentTimestamp,
    };
    if (payment.status === "paid") {
      quotePatch.conversionStage = "converted";
    }

    await QuoteProposal.updateMany(
      buildTenantFilter(req, { bookingId: payment.bookingId }),
      { $set: quotePatch }
    );
  }
};

const syncRevenueShadowWrites = async (req, payment = {}) => {
  await syncMongoDocumentToShadowStore({
    entityType: "payments",
    document: payment,
    model: PaymentTransaction,
  });

  try {
    await syncPaymentRevenueRecord(payment);
  } catch (error) {
    console.error("Payment revenue record sync failed:", error.message);
  }

  if (payment.bookingId) {
    const booking = await Booking.findOne(buildTenantFilter(req, { _id: payment.bookingId })).lean();
    if (booking) {
      await syncMongoDocumentToShadowStore({
        entityType: "bookings",
        document: booking,
        model: Booking,
      });

      try {
        await syncBookingRevenueRecord(booking);
      } catch (error) {
        console.error("Booking revenue record sync failed:", error.message);
      }
    }

    const quotes = await QuoteProposal.find(buildTenantFilter(req, { bookingId: payment.bookingId })).lean();
    for (const quote of quotes) {
      await syncMongoDocumentToShadowStore({
        entityType: "quotes",
        document: quote,
        model: QuoteProposal,
      });

      try {
        await syncQuoteRevenueRecord(quote);
      } catch (error) {
        console.error("Quote revenue record sync failed:", error.message);
      }
    }
  }
};

router.get("/checkout/:token", async (req, res) => {
  try {
    const paymentLookup = await findPaymentRevenueRecordByPublicToken(req.params.token, process.env);
    if (paymentLookup) {
      return res.status(200).json(buildPublicPaymentRevenueView(paymentLookup));
    }

    const payment = await PaymentTransaction.findOne(
      { publicToken: req.params.token }
    )
      .populate("bookingId", "name packageTour travelDate")
      .lean();

    if (!payment) {
      return res.status(404).json({ message: "Payment link not found." });
    }

    res.status(200).json({
      ...payment,
      ...toPaymentResponse(payment),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/checkout/:token/respond", async (req, res) => {
  try {
    const requestedStatus = req.body.status;
    const allowedStatuses = new Set(["paid", "failed", "cancelled", "refunded"]);

    if (!allowedStatuses.has(requestedStatus)) {
      return res.status(400).json({ message: "Unsupported payment response status." });
    }

    const paymentLookup = await findPaymentRevenueRecordByPublicToken(req.params.token, process.env);
    const payment = paymentLookup?.source_id
      ? await PaymentTransaction.findById(paymentLookup.source_id)
      : await PaymentTransaction.findOne({ publicToken: req.params.token });

    if (!payment) {
      return res.status(404).json({ message: "Payment link not found." });
    }

    const updates = buildPaymentStatusPatch({
      current: payment.toObject(),
      incomingStatus: requestedStatus,
      occurredAt: req.body.occurredAt,
      externalEventId: req.body.externalEventId,
      failureReason: req.body.failureReason,
    });

    Object.assign(payment, updates);
    await payment.save();
    await syncLinkedRevenueRecords(req, payment.toObject());
    await syncRevenueShadowWrites(req, payment.toObject());

    const refreshedPayment = await findPaymentRevenueRecordByPublicToken(req.params.token, process.env);

    res.status(200).json({
      ...(refreshedPayment
        ? buildPublicPaymentRevenueView(refreshedPayment)
        : toPaymentResponse(payment.toObject())),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/webhooks/:provider", async (req, res) => {
  try {
    const provider = (req.params.provider || "").toLowerCase();
    if (!["stripe", "pesapal"].includes(provider)) {
      return res.status(400).json({ message: "Unsupported payment provider." });
    }

    const {
      publicToken = "",
      providerReference = "",
      status,
      externalEventId = "",
      occurredAt,
      failureReason = "",
    } = req.body || {};

    if (!status) {
      return res.status(400).json({ message: "Webhook status is required." });
    }

    if (!publicToken && !providerReference) {
      return res.status(400).json({ message: "publicToken or providerReference is required." });
    }

    const paymentLookup = publicToken
      ? await findPaymentRevenueRecordByPublicToken(publicToken, process.env)
      : await findPaymentRevenueRecordByProviderReference(provider, providerReference, process.env);

    const payment = paymentLookup?.source_id
      ? await PaymentTransaction.findById(paymentLookup.source_id)
      : await PaymentTransaction.findOne({
          provider,
          $or: [
            publicToken ? { publicToken } : null,
            providerReference ? { providerReference } : null,
          ].filter(Boolean),
        });

    if (!payment) {
      return res.status(404).json({ message: "Payment transaction not found." });
    }

    if (
      shouldIgnoreWebhookEvent({
        currentStatus: payment.status,
        incomingStatus: status,
        externalEventId,
        processedEventIds: payment.processedEventIds,
      })
    ) {
      return res.status(200).json({ ignored: true });
    }

    const patch = buildPaymentStatusPatch({
      current: payment.toObject(),
      incomingStatus: status,
      occurredAt,
      externalEventId,
      failureReason,
    });

    Object.assign(payment, patch, {
      providerReference: providerReference || payment.providerReference || "",
    });
    await payment.save();
    await syncLinkedRevenueRecords(req, payment.toObject());
    await syncRevenueShadowWrites(req, payment.toObject());

    return res.status(200).json({
      ignored: false,
      payment: toPaymentResponse(payment.toObject()),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("payment-automation"));

router.get("/", async (req, res) => {
  try {
    const payments = await PaymentTransaction.find(buildTenantFilter(req))
      .populate("bookingId", "name packageTour status revenueStage paymentStatus totalPrice")
      .sort({ createdAt: -1 })
      .lean();

    const legacyPayments = payments.map((payment) => ({
      ...toPaymentResponse(payment),
    }));

    if (String(req.query.source || "").toLowerCase() === "postgres") {
      const primaryPayments = await fetchPrimaryPayments(String(req.tenantId || ""));
      return res.status(200).json(preferPrimaryCollection(primaryPayments, legacyPayments));
    }

    res.status(200).json(legacyPayments);
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
      providerReference: req.body.providerReference,
      status: req.body.status,
      notes: req.body.notes,
      failureReason: req.body.failureReason,
    });

    if (payload.bookingId && !payload.customerName) {
      const booking = await Booking.findOne(buildTenantFilter(req, { _id: payload.bookingId })).lean();
      payload.customerName = booking?.name || "";
      payload.amount = payload.amount || booking?.totalPrice || 0;
    }

    const amount = Number(payload.amount || 0);
    const feePercent = Number(payload.feePercent || 0);
    payload.feeAmount = Number(payload.feeAmount || ((amount * feePercent) / 100).toFixed(2));
    const payment = new PaymentTransaction(payload);
    const baseUrl = resolveTenantBaseUrl(req);
    payment.checkoutUrl =
      payment.checkoutUrl ||
      buildPublicPaymentCheckoutUrl(baseUrl, payment.publicToken);
    await payment.save();
    await syncLinkedRevenueRecords(req, payment.toObject());
    await syncRevenueShadowWrites(req, payment.toObject());

    res.status(201).json({
      ...toPaymentResponse(payment.toObject()),
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
      providerReference: req.body.providerReference,
      status: req.body.status,
      notes: req.body.notes,
      failureReason: req.body.failureReason,
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

    const nextUpdates =
      updates.status
        ? {
            ...updates,
            ...buildPaymentStatusPatch({
              current: paymentBeforeUpdate,
              incomingStatus: updates.status,
              occurredAt: req.body.occurredAt,
              externalEventId: req.body.externalEventId,
              failureReason: req.body.failureReason,
            }),
          }
        : updates;

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
    await syncLinkedRevenueRecords(req, payment);
    await syncRevenueShadowWrites(req, payment);

    res.status(200).json({
      ...toPaymentResponse(payment),
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

    await deletePaymentRevenueRecord(payment._id, payment.tenantId);
    await deleteMongoDocumentFromShadowStore({
      entityType: "payments",
      sourceId: payment._id,
    });

    res.status(200).json({ message: "Payment transaction deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
