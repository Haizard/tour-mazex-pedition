import RestaurantReservationRequest from "../models/RestaurantReservationRequest.js";

const STATUS_MAP = {
  pending: "pending",
  paid: "paid",
  failed: "failed",
  cancelled: "failed",
  refunded: "refunded",
};

const toCurrency = (value) => String(value || "USD").trim().toUpperCase() || "USD";

const toDateOrNull = (value) => {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

export const shouldSyncRestaurantReservationPayment = (payment = {}) =>
  Boolean(payment.restaurantReservationRequestId);

export const buildRestaurantReservationPaymentPatch = (payment = {}) => {
  const paymentStatus = STATUS_MAP[payment.status] || "pending";
  const patch = {
    paymentStatus,
    paymentTransactionId: payment._id || payment.id || payment.paymentTransactionId || null,
    paymentAmount: Number(payment.amount || 0),
    paymentCurrency: toCurrency(payment.currency),
  };

  if (paymentStatus === "paid") {
    patch.paymentPaidAt = toDateOrNull(payment.paidAt) || new Date();
  }

  return patch;
};

export const syncRestaurantReservationPaymentState = async (
  payment = {},
  { updateReservation } = {}
) => {
  if (!shouldSyncRestaurantReservationPayment(payment)) {
    return { synced: false, skipped: true };
  }

  const reservationId = String(payment.restaurantReservationRequestId || "");
  const patch = buildRestaurantReservationPaymentPatch(payment);
  const updater =
    updateReservation ||
    (async ({ reservationId: id, patch: update }) =>
      RestaurantReservationRequest.findByIdAndUpdate(id, { $set: update }, { new: true }));

  const reservation = await updater({ reservationId, patch });

  return {
    synced: Boolean(reservation),
    skipped: false,
    reservation,
  };
};
