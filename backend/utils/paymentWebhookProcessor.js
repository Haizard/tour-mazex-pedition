import PaymentTransaction from "../models/PaymentTransaction.js";
import { getRedisClient } from "./redisClient.js";
import {
  acquirePaymentWebhookProcessingLock,
  dequeuePaymentWebhookJob,
  drainPaymentWebhookQueue,
  releasePaymentWebhookProcessingLock,
} from "./paymentWebhookQueue.js";
import {
  syncLinkedPaymentRevenueRecords,
  syncPaymentRevenueShadowWrites,
} from "./paymentRevenueSync.js";
import { syncRestaurantReservationPaymentState } from "./restaurantPaymentLifecycle.js";

export const processQueuedPaymentWebhooksNow = async ({
  env = globalThis.process?.env || {},
  limit = 25,
} = {}) => {
  const redisClient = await getRedisClient(env).catch(() => null);

  if (!redisClient) {
    return {
      attempted: 0,
      processed: 0,
      failed: 0,
      ignored: 0,
      remaining: false,
    };
  }

  const lockAcquired = await acquirePaymentWebhookProcessingLock({ redisClient });
  if (!lockAcquired) {
    return {
      attempted: 0,
      processed: 0,
      failed: 0,
      ignored: 0,
      remaining: true,
    };
  }

  try {
    return await drainPaymentWebhookQueue({
      limit,
      dequeueJob: async () => dequeuePaymentWebhookJob({ redisClient }),
      loadPayment: async (job) => PaymentTransaction.findById(job.paymentId),
      savePayment: async (payment) => payment.save(),
      syncLinkedRecords: async (payment) =>
        Promise.all([
          syncLinkedPaymentRevenueRecords(String(payment.tenantId || ""), payment.toObject?.() || payment),
          syncRestaurantReservationPaymentState(payment.toObject?.() || payment),
        ]),
      syncRevenueShadowWrites: async (payment) =>
        syncPaymentRevenueShadowWrites(String(payment.tenantId || ""), payment.toObject?.() || payment),
    });
  } finally {
    await releasePaymentWebhookProcessingLock({ redisClient }).catch(() => {});
  }
};

let paymentWebhookLoopHandle = null;

export const startPaymentWebhookProcessingLoop = ({
  env = globalThis.process?.env || {},
  intervalMs = 15000,
} = {}) => {
  if (paymentWebhookLoopHandle) {
    return paymentWebhookLoopHandle;
  }

  paymentWebhookLoopHandle = setInterval(() => {
    processQueuedPaymentWebhooksNow({ env }).catch((error) => {
      console.error("Payment webhook processing loop error:", error.message);
    });
  }, intervalMs);

  return paymentWebhookLoopHandle;
};

export const stopPaymentWebhookProcessingLoop = () => {
  if (!paymentWebhookLoopHandle) {
    return;
  }

  clearInterval(paymentWebhookLoopHandle);
  paymentWebhookLoopHandle = null;
};
