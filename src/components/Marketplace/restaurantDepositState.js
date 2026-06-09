export const buildReservationDepositStatus = (checkout = {}) => {
  const { reservation = {}, payment = {}, estimatedDeposit = null, checkoutSettings = {} } = checkout;

  const reservationStatus = reservation.paymentStatus || "not_required";

  // Active payment that needs traveler action
  if (payment && payment.status === "pending") {
    return {
      stage: "payment_pending",
      label: "Deposit pending",
      tone: "warning",
      message: "A deposit payment is pending on this reservation.",
      actionLabel: "Pay deposit now",
      publicToken: payment.publicToken,
      checkoutUrl: payment.checkoutUrl,
      amount: payment.amount,
      currency: payment.currency,
      paymentInstructions: payment.notes || checkoutSettings.paymentInstructions || "",
    };
  }

  // Deposit already paid
  if (reservationStatus === "paid") {
    return {
      stage: "paid",
      label: "Deposit paid",
      tone: "success",
      message: "Your deposit has been paid. The restaurant will confirm your table.",
      actionLabel: "",
      publicToken: "",
      checkoutUrl: "",
      amount: reservation.paymentAmount || 0,
      currency: reservation.paymentCurrency || "USD",
      paymentInstructions: "",
    };
  }

  // Deposit has been requested by partner
  if (reservationStatus === "payment_requested") {
    return {
      stage: "payment_requested",
      label: "Deposit requested",
      tone: "info",
      message: "The restaurant has requested a deposit. A payment link has been sent to you.",
      actionLabel: payment?.checkoutUrl ? "View payment" : "",
      publicToken: payment?.publicToken || "",
      checkoutUrl: payment?.checkoutUrl || "",
      amount: reservation.paymentAmount || 0,
      currency: reservation.paymentCurrency || "USD",
      paymentInstructions: reservation.paymentInstructions || "",
    };
  }

  // Deposit not required (reservation is free or already settled)
  if (reservationStatus === "not_required" || reservationStatus === "refunded") {
    // Show estimated deposit info if checkout is enabled
    if (estimatedDeposit && estimatedDeposit.amount > 0) {
      return {
        stage: "estimated",
        label: "Deposit may be required",
        tone: "info",
        message: `An estimated deposit of ${estimatedDeposit.currency} ${Number(estimatedDeposit.amount).toLocaleString()} may be required once the restaurant confirms your reservation.`,
        actionLabel: "",
        publicToken: "",
        checkoutUrl: "",
        amount: estimatedDeposit.amount,
        currency: estimatedDeposit.currency,
        paymentInstructions: estimatedDeposit.paymentInstructions || checkoutSettings.paymentInstructions || "",
      };
    }

    return {
      stage: "not_required",
      label: "No deposit required",
      tone: "neutral",
      message: "No deposit is needed for this reservation.",
      actionLabel: "",
      publicToken: "",
      checkoutUrl: "",
      amount: 0,
      currency: "USD",
      paymentInstructions: "",
    };
  }

  // Fallback for failed or cancelled payments
  if (reservationStatus === "failed") {
    return {
      stage: "failed",
      label: "Payment issue",
      tone: "error",
      message: "There was an issue with the payment. Please contact the restaurant.",
      actionLabel: "",
      publicToken: "",
      checkoutUrl: "",
      amount: 0,
      currency: "USD",
      paymentInstructions: "",
    };
  }

  return {
    stage: "unknown",
    label: "Reservation submitted",
    tone: "neutral",
    message: "Your reservation request has been submitted.",
    actionLabel: "",
    publicToken: "",
    checkoutUrl: "",
    amount: 0,
    currency: "USD",
    paymentInstructions: "",
  };
};

export const formatDepositAmount = (amount = 0, currency = "USD") => {
  const num = Number(amount) || 0;
  const symbol = currency === "TZS" ? "TSh" : currency || "USD";
  return `${symbol} ${num.toLocaleString()}`;
};
