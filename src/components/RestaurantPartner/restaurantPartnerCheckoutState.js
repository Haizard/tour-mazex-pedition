const toTrimmedString = (value) => String(value || "").trim();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const buildRestaurantCheckoutSettingsPayload = (form = {}) => ({
  enabled: form.enabled === true,
  depositMode: form.depositMode || "none",
  depositAmount: Math.max(0, toNumber(form.depositAmount, 0)),
  depositPercentage: Math.min(Math.max(toNumber(form.depositPercentage, 0), 0), 100),
  currency: toTrimmedString(form.currency || "USD").toUpperCase(),
  paymentInstructions: toTrimmedString(form.paymentInstructions),
  autoDeposit: form.autoDeposit === true,
});

export const buildDepositPaymentPayload = () => ({
  paymentMode: "deposit",
});

export const buildCustomDiningPaymentPayload = (form = {}) => ({
  paymentMode: "custom",
  amount: Math.max(0, toNumber(form.amount, 0)),
  currency: toTrimmedString(form.currency || "USD").toUpperCase(),
  paymentReason: form.paymentReason || "custom",
  paymentInstructions: toTrimmedString(form.paymentInstructions),
});

export const getRestaurantPaymentStatusLabel = (status = "not_required") => {
  const labels = {
    not_required: "Not required",
    payment_requested: "Payment requested",
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
  };
  return labels[status] || labels.not_required;
};
