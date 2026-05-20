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
import {
  buildPaymentRevenueView,
  buildPublicPaymentRevenueView,
  deletePaymentRevenueRecord,
  findPaymentRevenueRecord,
  findPaymentRevenueRecordByProviderReference,
  findPaymentRevenueRecordByPublicToken,
} from "../utils/postgresRevenueRecords.js";
import { fetchPrimaryPayments } from "../utils/postgresPrimaryReads.js";
import { preferPrimaryCollection } from "../utils/postgresReadFallback.js";
import { safePrimaryLookup } from "../utils/safePrimaryLookup.js";
import { getRedisClient } from "../utils/redisClient.js";
import {
  buildPaymentWebhookJob,
  enqueuePaymentWebhookJob,
  markPaymentWebhookQueued,
} from "../utils/paymentWebhookQueue.js";
import {
  deletePaymentShadowArtifacts,
  syncLinkedPaymentRevenueRecords,
  syncPaymentRevenueShadowWrites,
} from "../utils/paymentRevenueSync.js";
import { persistInvoicePdf } from "../utils/invoicePdfStorage.js";
import {
  createPostgresFirstPayment,
  updatePostgresFirstPayment,
} from "../utils/postgresFirstPaymentService.js";

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

const syncLinkedRevenueRecords = async (req, payment = {}) => {
  await syncLinkedPaymentRevenueRecords(String(req.tenantId || ""), payment);
};

const syncRevenueShadowWrites = async (req, payment = {}) => {
  await syncPaymentRevenueShadowWrites(String(req.tenantId || ""), payment);
};

router.get("/checkout/:token", async (req, res) => {
  try {
    const paymentLookup = await safePrimaryLookup(
      () => findPaymentRevenueRecordByPublicToken(req.params.token, process.env),
      {
        onError: (error) => {
          console.error("Primary payment checkout lookup failed:", error.message);
        },
      }
    );
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

    const paymentLookup = await safePrimaryLookup(
      () => findPaymentRevenueRecordByPublicToken(req.params.token, process.env),
      {
        onError: (error) => {
          console.error("Primary payment response lookup failed:", error.message);
        },
      }
    );
    const payment = paymentLookup?.source_id
      ? await PaymentTransaction.findById(paymentLookup.source_id)
      : await PaymentTransaction.findOne({ publicToken: req.params.token });

    if (!payment) {
      return res.status(404).json({ message: "Payment link not found." });
    }

    if (
      shouldIgnoreWebhookEvent({
        currentStatus: payment.status,
        incomingStatus: requestedStatus,
        externalEventId: req.body.externalEventId,
        processedEventIds: payment.processedEventIds,
      })
    ) {
      return res.status(200).json({
        ignored: true,
        ...(toPaymentResponse(payment.toObject())),
      });
    }

    const updates = buildPaymentStatusPatch({
      current: payment.toObject(),
      incomingStatus: requestedStatus,
      occurredAt: req.body.occurredAt,
      externalEventId: req.body.externalEventId,
      failureReason: req.body.failureReason,
    });

    const updatedPayment = await updatePostgresFirstPayment(
      payment._id,
      payment.tenantId,
      updates,
      process.env
    );
    const updatedPaymentRecord = updatedPayment?.toObject?.() || updatedPayment;
    await syncLinkedRevenueRecords(req, updatedPaymentRecord);

    const refreshedPayment = await safePrimaryLookup(
      () => findPaymentRevenueRecordByPublicToken(req.params.token, process.env),
      {
        onError: (error) => {
          console.error("Primary payment refresh lookup failed:", error.message);
        },
      }
    );

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

    const paymentLookup = await safePrimaryLookup(
      () =>
        publicToken
          ? findPaymentRevenueRecordByPublicToken(publicToken, process.env)
          : findPaymentRevenueRecordByProviderReference(provider, providerReference, process.env),
      {
        onError: (error) => {
          console.error("Primary payment webhook lookup failed:", error.message);
        },
      }
    );

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

    const job = buildPaymentWebhookJob({
      paymentId: payment._id,
      provider,
      publicToken,
      providerReference,
      status,
      externalEventId,
      occurredAt,
      failureReason,
    });

    const redisClient = await getRedisClient(process.env).catch(() => null);
    if (redisClient) {
      const queued = await markPaymentWebhookQueued({
        redisClient,
        job,
      });

      if (!queued) {
        return res.status(200).json({ ignored: true, queued: false });
      }

      await enqueuePaymentWebhookJob({
        redisClient,
        job,
      });

      return res.status(202).json({
        ignored: false,
        queued: true,
      });
    }

    if (
      shouldIgnoreWebhookEvent({
        currentStatus: payment.status,
        incomingStatus: status,
        externalEventId,
        processedEventIds: payment.processedEventIds,
      })
    ) {
      return res.status(200).json({ ignored: true, queued: false });
    }

    const patch = buildPaymentStatusPatch({
      current: payment.toObject(),
      incomingStatus: status,
      occurredAt,
      externalEventId,
      failureReason,
    });

    const updatedPayment = await updatePostgresFirstPayment(
      payment._id,
      payment.tenantId,
      {
        ...patch,
        providerReference: providerReference || payment.providerReference || "",
      },
      process.env
    );
    const updatedPaymentRecord = updatedPayment?.toObject?.() || updatedPayment;
    await syncLinkedRevenueRecords(req, updatedPaymentRecord);

    return res.status(200).json({
      ignored: false,
      queued: false,
      payment: toPaymentResponse(updatedPaymentRecord),
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
    const payment = await createPostgresFirstPayment(payload, process.env);
    await syncLinkedRevenueRecords(req, payment.toObject());
    const primaryPayment = await safePrimaryLookup(
      () => findPaymentRevenueRecord(payment._id, req.tenantId, process.env),
      {
        onError: (error) => {
          console.error("Primary payment create refresh failed:", error.message);
        },
      }
    );

    res.status(201).json({
      ...(primaryPayment
        ? buildPaymentRevenueView(primaryPayment)
        : toPaymentResponse(payment.toObject())),
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

    const payment = await updatePostgresFirstPayment(
      req.params.id,
      req.tenantId,
      nextUpdates,
      process.env
    );
    await syncLinkedRevenueRecords(req, payment);
    const primaryPayment = await safePrimaryLookup(
      () => findPaymentRevenueRecord(payment._id, req.tenantId, process.env),
      {
        onError: (error) => {
          console.error("Primary payment update refresh failed:", error.message);
        },
      }
    );

    res.status(200).json({
      ...(primaryPayment
        ? buildPaymentRevenueView(primaryPayment)
        : toPaymentResponse(payment)),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/:id/generate-pdf", async (req, res) => {
  try {
    const payment = await persistInvoicePdf({
      transactionId: req.params.id,
      tenantId: req.tenantId,
      env: process.env,
    });

    await updatePostgresFirstPayment(
      payment._id,
      payment.tenantId,
      {},
      process.env
    );

    res.status(200).json({
      message: "Invoice PDF generated and stored successfully.",
      payment: toPaymentResponse(payment.toObject()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    await deletePaymentShadowArtifacts(payment);

    res.status(200).json({ message: "Payment transaction deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
