import test from "node:test";
import assert from "node:assert/strict";

import { canAccessFeature } from "../utils/subscriptionPlans.js";

test("canAccessFeature enables plan-locked features when a true override is present", () => {
  const result = canAccessFeature(
    {
      plan: "starter",
      status: "active",
      featureOverrides: {
        "social-posts": true,
      },
    },
    "social-posts"
  );

  assert.equal(result, true);
});

test("canAccessFeature keeps plan features enabled when there is no explicit override", () => {
  const result = canAccessFeature(
    {
      plan: "growth",
      status: "active",
      featureOverrides: {},
    },
    "social-posts"
  );

  assert.equal(result, true);
});
