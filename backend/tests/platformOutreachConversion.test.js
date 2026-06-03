import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlatformOutreachConversionPayload,
  summarizePlatformOutreachConversions,
} from "../utils/platformOutreachConversion.js";

test("buildPlatformOutreachConversionPayload creates a safe revenue attribution record", () => {
  const payload = buildPlatformOutreachConversionPayload({
    stage: "subscription_won",
    revenueAmount: "1200.50",
    currency: "usd",
    source: "manual-admin",
    occurredAt: "2026-05-29T12:00:00.000Z",
    notes: "Operator upgraded after demo.",
  });

  assert.equal(payload.stage, "subscription_won");
  assert.equal(payload.revenueAmount, 1200.5);
  assert.equal(payload.currency, "USD");
  assert.equal(payload.source, "manual-admin");
  assert.equal(payload.occurredAt.toISOString(), "2026-05-29T12:00:00.000Z");
});

test("summarizePlatformOutreachConversions counts funnel and revenue totals", () => {
  const summary = summarizePlatformOutreachConversions([
    { conversionAttribution: { stage: "demo_booked", revenueAmount: 0 } },
    { conversionAttribution: { stage: "trial_started", revenueAmount: 0 } },
    { conversionAttribution: { stage: "subscription_won", revenueAmount: 400 } },
    { conversionAttribution: { stage: "subscription_won", revenueAmount: 600 } },
  ]);

  assert.deepEqual(summary, {
    demoBookedCount: 1,
    trialStartedCount: 1,
    subscriptionWonCount: 2,
    attributedRevenue: 1000,
  });
});
