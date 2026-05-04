import {
  buildPaymentStatusPatch,
  shouldIgnoreWebhookEvent,
} from "./paymentWebhookState.js";

export const PAYMENT_WEBHOOK_QUEUE_KEY = "payment_webhook_jobs";
export const PAYMENT_WEBHOOK_LOCK_KEY = "payment_webhook_lock";
export const PAYMENT_WEBHOOK_DEDUPE_PREFIX = "payment_webhook_job";

export const buildPaymentWebhookJob = ({
  paymentId = "",
  provider = "",
  publicToken = "",
  providerReference = "",
  status = "",
  externalEventId = "",
  occurredAt = "",
  failureReason = "",
} = {}) => ({
  paymentId: String(paymentId || ""),
  provider: String(provider || "").trim().toLowerCase(),
  publicToken: String(publicToken || "").trim(),
  providerReference: String(providerReference || "").trim(),
  status: String(status || "").trim().toLowerCase(),
  externalEventId: String(externalEventId || "").trim(),
  occurredAt: occurredAt || "",
  failureReason: String(failureReason || "").trim(),
});

export const buildPaymentWebhookDedupeKey = (job = {}) => {
  if (job.externalEventId) {
    return `${PAYMENT_WEBHOOK_DEDUPE_PREFIX}:event:${job.externalEventId}`;
  }

  return `${PAYMENT_WEBHOOK_DEDUPE_PREFIX}:${String(job.paymentId || "")}:${String(job.status || "")}:${String(job.occurredAt || "latest")}`;
};

export const enqueuePaymentWebhookJob = async ({
  redisClient,
  queueKey = PAYMENT_WEBHOOK_QUEUE_KEY,
  job,
} = {}) => {
  await redisClient.lPush(queueKey, JSON.stringify(job));
};

export const dequeuePaymentWebhookJob = async ({
  redisClient,
  queueKey = PAYMENT_WEBHOOK_QUEUE_KEY,
} = {}) => {
  const payload = await redisClient.rPop(queueKey);
  return payload ? JSON.parse(payload) : null;
};

export const markPaymentWebhookQueued = async ({
  redisClient,
  job,
  ttlSeconds = 60 * 60 * 24 * 7,
} = {}) => {
  const result = await redisClient.set(
    buildPaymentWebhookDedupeKey(job),
    "1",
    { NX: true, EX: ttlSeconds }
  );

  return result === "OK";
};

export const acquirePaymentWebhookProcessingLock = async ({
  redisClient,
  lockKey = PAYMENT_WEBHOOK_LOCK_KEY,
  ttlSeconds = 60,
} = {}) => {
  const result = await redisClient.set(lockKey, "1", { NX: true, EX: ttlSeconds });
  return result === "OK";
};

export const releasePaymentWebhookProcessingLock = async ({
  redisClient,
  lockKey = PAYMENT_WEBHOOK_LOCK_KEY,
} = {}) => {
  await redisClient.del(lockKey);
};

export const processQueuedPaymentWebhook = async ({
  job,
  loadPayment = async () => null,
  savePayment = async () => {},
  syncLinkedRecords = async () => {},
  syncRevenueShadowWrites = async () => {},
} = {}) => {
  const payment = await loadPayment(job);
  if (!payment) {
    return { changed: false, ignored: false, missing: true };
  }

  const current = payment.toObject?.() || payment;
  if (
    shouldIgnoreWebhookEvent({
      currentStatus: current.status,
      incomingStatus: job.status,
      externalEventId: job.externalEventId,
      processedEventIds: current.processedEventIds,
    })
  ) {
    return { changed: false, ignored: true, missing: false };
  }

  const patch = buildPaymentStatusPatch({
    current,
    incomingStatus: job.status,
    occurredAt: job.occurredAt,
    externalEventId: job.externalEventId,
    failureReason: job.failureReason,
  });

  Object.assign(payment, patch, {
    providerReference: job.providerReference || payment.providerReference || "",
  });

  await savePayment(payment, job);
  await syncLinkedRecords(payment, job);
  await syncRevenueShadowWrites(payment, job);

  return { changed: true, ignored: false, missing: false };
};

export const drainPaymentWebhookQueue = async ({
  limit = 25,
  dequeueJob = async () => null,
  loadPayment = async () => null,
  savePayment = async () => {},
  syncLinkedRecords = async () => {},
  syncRevenueShadowWrites = async () => {},
} = {}) => {
  const summary = {
    attempted: 0,
    processed: 0,
    failed: 0,
    ignored: 0,
    remaining: false,
  };

  for (let index = 0; index < limit; index += 1) {
    const job = await dequeueJob();
    if (!job) {
      summary.remaining = false;
      return summary;
    }

    summary.attempted += 1;

    try {
      const result = await processQueuedPaymentWebhook({
        job,
        loadPayment,
        savePayment,
        syncLinkedRecords,
        syncRevenueShadowWrites,
      });

      if (result.ignored) {
        summary.ignored += 1;
        continue;
      }

      if (result.missing) {
        summary.failed += 1;
        continue;
      }

      if (result.changed) {
        summary.processed += 1;
      }
    } catch (_error) {
      summary.failed += 1;
    }
  }

  summary.remaining = true;
  return summary;
};
