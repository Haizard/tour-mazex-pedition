import test from "node:test";
import assert from "node:assert/strict";

import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
  };

  response.status = (code) => {
    response.statusCode = code;
    return response;
  };

  response.json = (payload) => {
    response.body = payload;
    return response;
  };

  return response;
};

test("requireSubscriptionFeature calls next when tenant can access the feature", async () => {
  const req = {
    tenant: {
      subscription: {
        plan: "growth",
        status: "active",
      },
    },
  };
  const res = createResponse();
  let nextCalled = false;

  requireSubscriptionFeature("social-posts")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test("requireSubscriptionFeature returns 403 when tenant plan is missing access", async () => {
  const req = {
    tenant: {
      subscription: {
        plan: "starter",
        status: "active",
      },
    },
  };
  const res = createResponse();

  requireSubscriptionFeature("campaigns")(req, res, () => {
    throw new Error("next should not be called");
  });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.upgradeRequired, true);
  assert.equal(res.body.currentPlan, "starter");
});

