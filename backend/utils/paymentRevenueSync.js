import Booking from "../models/Booking.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import QuoteProposal from "../models/QuoteProposal.js";
import {
  deleteMongoDocumentFromShadowStore,
  syncMongoDocumentToShadowStore,
} from "./postgresShadowWrites.js";
import {
  syncBookingRevenueRecord,
  syncPaymentRevenueRecord,
  syncQuoteRevenueRecord,
} from "./postgresRevenueRecords.js";
import { persistInvoicePdf } from "./invoicePdfStorage.js";
import { persistItineraryPdf } from "./itineraryPdfStorage.js";
import { updatePostgresFirstBooking } from "./postgresFirstBookingService.js";
import { updateManyPostgresFirstQuotes } from "./postgresFirstQuoteService.js";

export const buildBookingPaymentState = (payment = {}) => {
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

const buildTenantQuery = (tenantId = "", filter = {}) => ({
  tenantId,
  ...filter,
});

export const syncLinkedPaymentRevenueRecords = async (tenantId = "", payment = {}) => {
  const paymentTimestamp =
    payment.refundedAt ||
    payment.paidAt ||
    payment.failedAt ||
    payment.cancelledAt ||
    payment.updatedAt ||
    new Date();

  if (!payment.bookingId || !tenantId) {
    return;
  }

  const bookingPatch = {
    ...buildBookingPaymentState(payment),
    paymentUpdatedAt: paymentTimestamp,
    convertedAt: payment.status === "paid" ? paymentTimestamp : undefined,
  };

  Object.keys(bookingPatch).forEach((key) => bookingPatch[key] === undefined && delete bookingPatch[key]);

  await updatePostgresFirstBooking(
    payment.bookingId,
    tenantId,
    bookingPatch
  );

  // Trigger automated artifacts
  if (payment.status === "paid") {
    // Generate Invoice
    persistInvoicePdf({
      transactionId: payment._id,
      tenantId,
    }).catch((err) => console.error("Auto-invoice generation failed:", err.message));

    // Generate/Update Itinerary (since it's now a paid/confirmed trip)
    persistItineraryPdf({
      bookingId: payment.bookingId,
      tenantId,
    }).catch((err) => console.error("Auto-itinerary generation failed:", err.message));
  }

  const quotePatch = {
    paymentStatus: payment.status || "pending",
    lastPaymentAt: paymentTimestamp,
  };

  if (payment.status === "paid") {
    quotePatch.conversionStage = "converted";
  }

  await updateManyPostgresFirstQuotes(
    buildTenantQuery(tenantId, { bookingId: payment.bookingId }),
    quotePatch,
    globalThis.process?.env || {}
  );
};

export const syncPaymentRevenueShadowWrites = async (tenantId = "", payment = {}) => {
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

  if (!payment.bookingId || !tenantId) {
    return;
  }

  const booking = await Booking.findOne(buildTenantQuery(tenantId, { _id: payment.bookingId })).lean();
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

  const quotes = await QuoteProposal.find(buildTenantQuery(tenantId, { bookingId: payment.bookingId })).lean();
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
};

export const deletePaymentShadowArtifacts = async (payment = {}) => {
  await deleteMongoDocumentFromShadowStore({
    entityType: "payments",
    sourceId: payment._id,
  });
};
