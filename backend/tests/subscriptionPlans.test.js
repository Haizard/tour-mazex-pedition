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
