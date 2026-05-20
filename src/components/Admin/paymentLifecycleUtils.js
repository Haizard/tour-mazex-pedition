const toHeadlineCase = (value = "") =>
  String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const buildPaymentLifecycleItems = (payment = {}) => {
  const items = [
    payment.status
      ? {
          key: "payment",
          label: "Payment",
          value: toHeadlineCase(payment.status),
        }
      : null,
    payment.bookingId?.status
      ? {
          key: "booking",
          label: "Booking",
          value: payment.bookingId.status,
        }
      : null,
    payment.bookingId?.revenueStage
      ? {
          key: "revenue",
          label: "Revenue",
          value: toHeadlineCase(payment.bookingId.revenueStage),
        }
      : null,
    payment.quoteProposal?.conversionStage
      ? {
          key: "quote-stage",
          label: "Quote Stage",
          value: toHeadlineCase(payment.quoteProposal.conversionStage),
        }
      : payment.quoteProposal?.status
        ? {
            key: "quote",
            label: "Quote",
            value: toHeadlineCase(payment.quoteProposal.status),
          }
        : null,
  ].filter(Boolean);

  return items;
};

export const buildPaymentLifecycleTimestampLabel = (payment = {}) => {
  const timestamp = payment.lifecycle?.paymentUpdatedAt || null;

  if (!timestamp) {
    return "";
  }

  return `Last status ${new Date(timestamp).toLocaleString()}`;
};
