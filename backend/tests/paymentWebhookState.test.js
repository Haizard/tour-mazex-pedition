import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPaymentStatusPatch,
  shouldIgnoreWebhookEvent,
} from "../utils/paymentWebhookState.js";

test("shouldIgnoreWebhookEvent ignores already processed provider events", () => {
  const result = shouldIgnoreWebhookEvent({
    currentStatus: "pending",
    incomingStatus: "paid",
    externalEventId: "evt_123",
    processedEventIds: ["evt_123"],
  });

  assert.equal(result, true);
});

test("shouldIgnoreWebhookEvent ignores status repeats without a new provider event id", () => {
  const result = shouldIgnoreWebhookEvent({
    currentStatus: "paid",
    incomingStatus: "paid",
    externalEventId: "",
    processedEventIds: [],
  });

  assert.equal(result, true);
});

test("shouldIgnoreWebhookEvent ignores regressive states after payment capture", () => {
  const result = shouldIgnoreWebhookEvent({
    currentStatus: "paid",
    incomingStatus: "failed",
    externalEventId: "evt_late_failure",
    processedEventIds: [],
  });

  assert.equal(result, true);
});

test("buildPaymentStatusPatch stores provider event and lifecycle timestamps", () => {
  const patch = buildPaymentStatusPatch({
    current: {
      status: "pending",
      processedEventIds: [],
    },
    incomingStatus: "failed",
    occurredAt: "2026-04-28T09:30:00.000Z",
    externalEventId: "evt_999",
    failureReason: "card_declined",
  });

  assert.equal(patch.status, "failed");
  assert.equal(patch.failureReason, "card_declined");
  assert.deepEqual(patch.processedEventIds, ["evt_999"]);
  assert.equal(patch.failedAt instanceof Date, true);
  assert.equal(patch.lastWebhookAt instanceof Date, true);
});

test("buildPaymentStatusPatch clears stale failure reasons after recovery", () => {
  const patch = buildPaymentStatusPatch({
    current: {
      status: "failed",
      failureReason: "insufficient_funds",
      processedEventIds: ["evt_old"],
    },
    incomingStatus: "paid",
    occurredAt: "2026-04-28T10:30:00.000Z",
    externalEventId: "evt_paid",
  });

  assert.equal(patch.status, "paid");
  assert.deepEqual(patch.processedEventIds, ["evt_old", "evt_paid"]);
  assert.equal(patch.failureReason, "");
  assert.equal(patch.paidAt instanceof Date, true);
});
