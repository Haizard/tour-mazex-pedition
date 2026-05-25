const PAYMENT_REASONS = new Set([
  "reservation_deposit",
  "event_dining",
  "private_dining",
  "group_dining",
  "custom",
]);

const ACTIVE_PAYMENT_STATUSES = new Set(["pending"]);

const toTrimmedString = (value) => String(value || "").trim();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Number((Number(value || 0) + Number.EPSILON).toFixed(2));

const normalizeCurrency = (value) => toTrimmedString(value || "USD").toUpperCase() || "USD";

export const normalizeRestaurantCheckoutSettings = (restaurant = {}) => {
  const settings = restaurant.restaurantCheckout || restaurant.checkoutSettings || restaurant || {};
  const depositMode = ["none", "fixed", "percentage", "custom-only"].includes(settings.depositMode)
    ? settings.depositMode
    : "none";

  return {
    enabled: settings.enabled === true,
    depositMode,
    depositAmount: Math.max(0, toNumber(settings.depositAmount, 0)),
    depositPercentage: Math.min(Math.max(toNumber(settings.depositPercentage, 0), 0), 100),
    currency: normalizeCurrency(settings.currency),
    paymentInstructions: toTrimmedString(settings.paymentInstructions),
  };
};

export const calculateRestaurantDepositAmount = ({ settings = {}, reservation = {} } = {}) => {
  const normalized = normalizeRestaurantCheckoutSettings(settings);

  if (!normalized.enabled || ["none", "custom-only"].includes(normalized.depositMode)) {
    throw new Error("Restaurant deposit checkout is not enabled.");
  }

  const amount =
    normalized.depositMode === "fixed"
      ? normalized.depositAmount
      : roundMoney((Math.max(0, toNumber(reservation.estimatedTotal, 0)) * normalized.depositPercentage) / 100);

  if (amount <= 0) {
    throw new Error("Deposit amount must be greater than zero.");
  }

  return {
    amount: roundMoney(amount),
    currency: normalized.currency,
    paymentReason: "reservation_deposit",
    paymentInstructions: normalized.paymentInstructions,
  };
};

export const validateCustomRestaurantPayment = (payment = {}) => {
  const amount = roundMoney(toNumber(payment.amount, 0));
  const paymentReason = PAYMENT_REASONS.has(payment.paymentReason)
    ? payment.paymentReason
    : "custom";

  if (amount <= 0) {
    throw new Error("Custom payment amount must be greater than zero.");
  }

  return {
    amount,
    currency: normalizeCurrency(payment.currency),
    paymentReason,
    paymentInstructions: toTrimmedString(payment.paymentInstructions || payment.notes),
  };
};

export const isActiveRestaurantPaymentTransaction = (transaction) =>
  Boolean(transaction && ACTIVE_PAYMENT_STATUSES.has(transaction.status));

export const buildRestaurantPaymentTransactionPayload = ({
  tenantId,
  restaurant = {},
  reservation = {},
  payment = {},
} = {}) => {
  const amount = roundMoney(toNumber(payment.amount, 0));
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  return {
    tenantId,
    customerName: reservation.travelerName || "",
    amount,
    currency: normalizeCurrency(payment.currency),
    checkoutKind: "restaurant_reservation",
    sourceType: "restaurant_reservation",
    restaurantId: restaurant._id,
    restaurantReservationRequestId: reservation._id,
    restaurantServiceWindowId: reservation.serviceWindowId || null,
    restaurantTableTypeId: reservation.tableTypeId || null,
    notes:
      payment.paymentInstructions ||
      `Restaurant payment request for ${restaurant.name || "restaurant reservation"}.`,
    sourceMeta: {
      restaurantName: restaurant.name || "",
      reservationSource: reservation.source || "direct",
      paymentReason: payment.paymentReason || "reservation_deposit",
      classification: reservation.autopilot?.classification || "",
    },
  };
};

export const buildReservationPaymentUpdate = ({
  transaction = {},
  paymentReason = "reservation_deposit",
  paymentInstructions = "",
} = {}) => ({
  paymentStatus: "payment_requested",
  paymentTransactionId: transaction._id,
  paymentAmount: roundMoney(toNumber(transaction.amount, 0)),
  paymentCurrency: normalizeCurrency(transaction.currency),
  paymentReason: PAYMENT_REASONS.has(paymentReason) ? paymentReason : "custom",
  paymentRequestedAt: new Date(),
  paymentInstructions: toTrimmedString(paymentInstructions),
});
