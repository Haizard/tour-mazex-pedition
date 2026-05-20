const toDateOrNow = (value) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const isRegressiveStatusTransition = (currentStatus = "", incomingStatus = "") => {
  if (!currentStatus || !incomingStatus || currentStatus === incomingStatus) {
    return false;
  }

  if (currentStatus === "refunded") {
    return true;
  }

  if (currentStatus === "paid" && ["failed", "cancelled", "pending"].includes(incomingStatus)) {
    return true;
  }

  return false;
};

export const shouldIgnoreWebhookEvent = ({
  currentStatus = "",
  incomingStatus = "",
  externalEventId = "",
  processedEventIds = [],
} = {}) => {
  if (externalEventId && (processedEventIds || []).includes(externalEventId)) {
    return true;
  }

  if (!externalEventId && currentStatus && incomingStatus && currentStatus === incomingStatus) {
    return true;
  }

  if (isRegressiveStatusTransition(currentStatus, incomingStatus)) {
    return true;
  }

  return false;
};

export const buildPaymentStatusPatch = ({
  current = {},
  incomingStatus = "",
  occurredAt,
  externalEventId = "",
  failureReason = "",
} = {}) => {
  const eventTimestamp = toDateOrNow(occurredAt);
  const nextProcessedEventIds = Array.isArray(current.processedEventIds)
    ? [...current.processedEventIds]
    : [];

  if (externalEventId && !nextProcessedEventIds.includes(externalEventId)) {
    nextProcessedEventIds.push(externalEventId);
  }

  const patch = {
    status: incomingStatus || current.status || "pending",
    processedEventIds: nextProcessedEventIds,
    lastWebhookAt: eventTimestamp,
  };

  if (externalEventId) {
    patch.lastWebhookEventId = externalEventId;
  }

  if (failureReason) {
    patch.failureReason = failureReason;
  } else if (incomingStatus && incomingStatus !== "failed" && current.failureReason) {
    patch.failureReason = "";
  }

  if (incomingStatus === "paid" && current.status !== "paid") {
    patch.paidAt = eventTimestamp;
  }

  if (incomingStatus === "failed" && current.status !== "failed") {
    patch.failedAt = eventTimestamp;
  }

  if (incomingStatus === "cancelled" && current.status !== "cancelled") {
    patch.cancelledAt = eventTimestamp;
  }

  if (incomingStatus === "refunded" && current.status !== "refunded") {
    patch.refundedAt = eventTimestamp;
  }

  return patch;
};
