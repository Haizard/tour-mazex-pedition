import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAutomaticPlatformOutreachAttribution,
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

test("buildAutomaticPlatformOutreachAttribution maps billing events to outreach conversion stages", () => {
  const attribution = buildAutomaticPlatformOutreachAttribution({
    eventType: "subscription.created",
    prospectId: "prospect-1",
    tenantId: "tenant-1",
    amount: "2500",
    currency: "tzs",
    occurredAt: "2026-06-03T09:00:00.000Z",
    sourceId: "stripe-sub-1",
  });

  assert.equal(attribution.stage, "subscription_won");
  assert.equal(attribution.source, "billing-system");
  assert.equal(attribution.revenueAmount, 2500);
  assert.equal(attribution.currency, "TZS");
  assert.equal(attribution.metadata.tenantId, "tenant-1");
  assert.equal(attribution.metadata.sourceId, "stripe-sub-1");
});

test("buildAutomaticPlatformOutreachAttribution maps trial and demo events", () => {
  assert.equal(
    buildAutomaticPlatformOutreachAttribution({ eventType: "trial.started", prospectEmail: "sales@example.com" }).stage,
    "trial_started",
  );
  assert.equal(
    buildAutomaticPlatformOutreachAttribution({ eventType: "demo.booked", prospectEmail: "sales@example.com" }).stage,
    "demo_booked",
  );
});
