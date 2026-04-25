import test from "node:test";
import assert from "node:assert/strict";

import {
  PRICING_PLANS,
  canAccessFeature,
  getPlanDefinition,
} from "../utils/subscriptionPlans.js";

test("getPlanDefinition returns the configured growth plan", () => {
  const plan = getPlanDefinition("growth");

  assert.equal(plan.code, "growth");
  assert.equal(plan.priceMonthlyUsd, 79);
  assert.ok(plan.features.includes("social-posts"));
});

test("canAccessFeature allows growth plan to use social posts", () => {
  const allowed = canAccessFeature(
    {
      plan: "growth",
      status: "active",
    },
    "social-posts"
  );

  assert.equal(allowed, true);
});

test("canAccessFeature blocks starter plan from campaigns", () => {
  const allowed = canAccessFeature(
    {
      plan: "starter",
      status: "active",
    },
    "campaigns"
  );

  assert.equal(allowed, false);
});

test("growth plan includes review automation", () => {
  const allowed = canAccessFeature(
    {
      plan: "growth",
      status: "active",
    },
    "review-automation"
  );

  assert.equal(allowed, true);
});

test("pro plan includes repeat customer automation", () => {
  const allowed = canAccessFeature(
    {
      plan: "pro",
      status: "active",
    },
    "repeat-customer-automation"
  );

  assert.equal(allowed, true);
});

test("pro plan includes guide and driver management", () => {
  const allowed = canAccessFeature(
    {
      plan: "pro",
      status: "active",
    },
    "guide-driver-management"
  );

  assert.equal(allowed, true);
});

test("pro plan includes accommodation coordination", () => {
  const allowed = canAccessFeature(
    {
      plan: "pro",
      status: "active",
    },
    "accommodation-coordination"
  );

  assert.equal(allowed, true);
});

test("pro plan includes airport pickup coordination", () => {
  const allowed = canAccessFeature(
    {
      plan: "pro",
      status: "active",
    },
    "airport-pickup-coordination"
  );

  assert.equal(allowed, true);
});

test("enterprise plan includes partner portal", () => {
  const allowed = canAccessFeature(
    {
      plan: "enterprise",
      status: "active",
    },
    "partner-portal"
  );

  assert.equal(allowed, true);
});

test("starter plan includes payment automation", () => {
  const allowed = canAccessFeature(
    {
      plan: "starter",
      status: "active",
    },
    "payment-automation"
  );

  assert.equal(allowed, true);
});

test("enterprise plan includes dynamic pricing engine", () => {
  const allowed = canAccessFeature(
    {
      plan: "enterprise",
      status: "active",
    },
    "dynamic-pricing-engine"
  );

  assert.equal(allowed, true);
});

test("growth plan includes travel documentation assistant", () => {
  const allowed = canAccessFeature(
    {
      plan: "growth",
      status: "active",
    },
    "travel-documentation-assistant"
  );

  assert.equal(allowed, true);
});

test("enterprise plan includes multi-language AI assistant", () => {
  const allowed = canAccessFeature(
    {
      plan: "enterprise",
      status: "active",
    },
    "multi-language-ai-assistant"
  );

  assert.equal(allowed, true);
});

test("enterprise plan includes competitor intelligence", () => {
  const allowed = canAccessFeature(
    {
      plan: "enterprise",
      status: "active",
    },
    "competitor-intelligence"
  );

  assert.equal(allowed, true);
});

test("free trial grants access using the assigned plan", () => {
  const allowed = canAccessFeature(
    {
      plan: "growth",
      status: "trialing",
    },
    "lead-inbox"
  );

  assert.equal(allowed, true);
});

test("plan catalog exposes public pricing plans", () => {
  assert.equal(PRICING_PLANS[0].code, "starter");
  assert.equal(PRICING_PLANS[1].highlighted, true);
  assert.equal(PRICING_PLANS[2].code, "pro");
});
