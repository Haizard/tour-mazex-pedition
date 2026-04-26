const formatMoney = (amount = 0, currency = "USD") =>
  `${currency.toUpperCase()} ${Number(amount || 0).toFixed(0)}`;

export const buildPublicPaymentCheckoutUrl = (baseUrl = "", token = "") => {
  const normalizedBaseUrl = (baseUrl || "").replace(/\/$/, "");
  return `${normalizedBaseUrl}/payment/${token}`;
};

export const summarizePaymentTransaction = (transaction = {}) => {
  const provider = (transaction.provider || "payment").toUpperCase();
  const amountLabel = formatMoney(transaction.amount, transaction.currency);
  const customerName = transaction.customerName || "Customer";

  if (transaction.status === "paid") {
    return {
      badgeLabel: "Paid",
      summary: `${provider} payment of ${amountLabel} was captured successfully.`,
    };
  }

  if (transaction.status === "failed") {
    return {
      badgeLabel: "Failed",
      summary: `${provider} payment attempt for ${customerName} failed and needs retry or manual follow-up.`,
    };
  }

  if (transaction.status === "cancelled") {
    return {
      badgeLabel: "Cancelled",
      summary: `${provider} payment flow for ${customerName} was cancelled before completion.`,
    };
  }

  return {
    badgeLabel: "Pending",
    summary: `${customerName} has a pending ${provider} checkout for ${amountLabel}.`,
  };
};
