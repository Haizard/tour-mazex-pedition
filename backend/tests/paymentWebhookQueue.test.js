import test from "node:test";
import assert from "node:assert/strict";

import {
  PAYMENT_WEBHOOK_DEDUPE_PREFIX,
  buildPaymentWebhookDedupeKey,
  buildPaymentWebhookJob,
  processQueuedPaymentWebhook,
  drainPaymentWebhookQueue,
} from "../utils/paymentWebhookQueue.js";

test("buildPaymentWebhookJob normalizes webhook payload for queue transport", () => {
  const job = buildPaymentWebhookJob({
    paymentId: 123,
    provider: "Stripe",
    publicToken: "tok_1",
    providerReference: "pi_1",
    status: "paid",
    externalEventId: "evt_1",
    occurredAt: "2026-05-04T10:00:00.000Z",
    failureReason: "",
  });

  assert.deepEqual(job, {
    paymentId: "123",
    provider: "stripe",
    publicToken: "tok_1",
    providerReference: "pi_1",
    status: "paid",
    externalEventId: "evt_1",
    occurredAt: "2026-05-04T10:00:00.000Z",
    failureReason: "",
  });
});

test("buildPaymentWebhookDedupeKey prefers provider event ids when available", () => {
  const key = buildPaymentWebhookDedupeKey({
    paymentId: "abc",
    status: "paid",
    externalEventId: "evt_123",
  });

  assert.equal(key, `${PAYMENT_WEBHOOK_DEDUPE_PREFIX}:event:evt_123`);
});

test("processQueuedPaymentWebhook updates lifecycle and sync hooks for valid events", async () => {
  const payment = {
    status: "pending",
    processedEventIds: [],
    providerReference: "",
    toObject() {
      return {
        status: this.status,
        processedEventIds: this.processedEventIds,
        providerReference: this.providerReference,
      };
    },
  };

  const calls = [];
  const result = await processQueuedPaymentWebhook({
    job: buildPaymentWebhookJob({
      paymentId: "pay_1",
      provider: "stripe",
      providerReference: "pi_live",
      status: "paid",
      externalEventId: "evt_live",
      occurredAt: "2026-05-04T12:30:00.000Z",
    }),
    loadPayment: async () => payment,
    savePayment: async (nextPayment) => {
      calls.push(["save", nextPayment.status]);
    },
    syncLinkedRecords: async (nextPayment) => {
      calls.push(["linked", nextPayment.status]);
    },
    syncRevenueShadowWrites: async (nextPayment) => {
      calls.push(["shadow", nextPayment.status]);
    },
  });

  assert.equal(result.changed, true);
  assert.equal(result.ignored, false);
  assert.equal(payment.status, "paid");
  assert.equal(payment.providerReference, "pi_live");
  assert.deepEqual(payment.processedEventIds, ["evt_live"]);
  assert.deepEqual(calls, [
    ["save", "paid"],
    ["linked", "paid"],
    ["shadow", "paid"],
  ]);
});

test("processQueuedPaymentWebhook ignores duplicate events without saving", async () => {
  let saveCalled = false;
  const result = await processQueuedPaymentWebhook({
    job: buildPaymentWebhookJob({
      paymentId: "pay_1",
      provider: "stripe",
      status: "paid",
      externalEventId: "evt_same",
    }),
    loadPayment: async () => ({
      status: "paid",
      processedEventIds: ["evt_same"],
      toObject() {
        return {
          status: this.status,
          processedEventIds: this.processedEventIds,
        };
      },
    }),
    savePayment: async () => {
      saveCalled = true;
    },
  });

  assert.equal(result.changed, false);
  assert.equal(result.ignored, true);
  assert.equal(saveCalled, false);
});

test("drainPaymentWebhookQueue processes queued jobs until the queue is empty", async () => {
  const jobs = [
    buildPaymentWebhookJob({
      paymentId: "pay_1",
      provider: "stripe",
      status: "paid",
      externalEventId: "evt_1",
    }),
    buildPaymentWebhookJob({
      paymentId: "pay_2",
      provider: "pesapal",
      status: "failed",
      externalEventId: "evt_2",
      failureReason: "declined",
    }),
  ];

  const payments = new Map([
    ["pay_1", {
      status: "pending",
      processedEventIds: [],
      toObject() {
        return {
          status: this.status,
          processedEventIds: this.processedEventIds,
        };
      },
    }],
    ["pay_2", {
      status: "pending",
      processedEventIds: [],
      toObject() {
        return {
          status: this.status,
          processedEventIds: this.processedEventIds,
        };
      },
    }],
  ]);

  const summary = await drainPaymentWebhookQueue({
    limit: 10,
    dequeueJob: async () => jobs.shift() || null,
    loadPayment: async (job) => payments.get(job.paymentId) || null,
    savePayment: async () => {},
    syncLinkedRecords: async () => {},
    syncRevenueShadowWrites: async () => {},
  });

  assert.deepEqual(summary, {
    attempted: 2,
    processed: 2,
    failed: 0,
    ignored: 0,
    remaining: false,
  });
  assert.equal(payments.get("pay_1").status, "paid");
  assert.equal(payments.get("pay_2").status, "failed");
});
