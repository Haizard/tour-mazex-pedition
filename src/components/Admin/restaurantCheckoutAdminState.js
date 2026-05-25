export const summarizeRestaurantReservationPayments = (requests = []) =>
  requests.reduce(
    (summary, request) => {
      summary.total += 1;
      if (request.paymentStatus === "payment_requested") summary.paymentRequested += 1;
      if (request.paymentStatus === "pending") summary.pending += 1;
      if (request.paymentStatus === "paid") summary.paid += 1;
      if (request.paymentStatus === "failed") summary.failed += 1;
      if (request.paymentStatus === "refunded") summary.refunded += 1;
      return summary;
    },
    {
      total: 0,
      paymentRequested: 0,
      pending: 0,
      paid: 0,
      failed: 0,
      refunded: 0,
    }
  );

export const canRequestRestaurantPayment = (request = {}) =>
  ["confirmed", "needs-clarification", "pending"].includes(request.status) &&
  !["payment_requested", "pending", "paid"].includes(request.paymentStatus);

export const formatRestaurantPaymentAmount = (request = {}) => {
  const currency = String(request.paymentCurrency || "USD").toUpperCase();
  const amount = Number(request.paymentAmount || 0);
  return `${currency} ${amount.toFixed(2)}`;
};
