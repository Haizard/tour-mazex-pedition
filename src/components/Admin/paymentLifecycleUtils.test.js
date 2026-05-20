import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPaymentLifecycleItems,
  buildPaymentLifecycleTimestampLabel,
} from "./paymentLifecycleUtils.js";

test("buildPaymentLifecycleItems summarizes payment, booking, and quote lifecycle states", () => {
  const items = buildPaymentLifecycleItems({
    status: "failed",
    bookingId: {
      status: "Confirmed",
      revenueStage: "awaiting-payment",
    },
    quoteProposal: {
      status: "accepted",
      conversionStage: "accepted",
    },
  });

  assert.deepEqual(items, [
    { key: "payment", label: "Payment", value: "Failed" },
    { key: "booking", label: "Booking", value: "Confirmed" },
    { key: "revenue", label: "Revenue", value: "Awaiting Payment" },
    { key: "quote-stage", label: "Quote Stage", value: "Accepted" },
  ]);
});

test("buildPaymentLifecycleTimestampLabel returns a readable status timestamp label", () => {
  const label = buildPaymentLifecycleTimestampLabel({
    lifecycle: {
      paymentUpdatedAt: "2026-05-20T10:15:00.000Z",
    },
  });

  assert.equal(label.startsWith("Last status "), true);
  assert.equal(label.includes("2026"), true);
});
