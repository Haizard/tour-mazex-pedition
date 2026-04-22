import test from "node:test";
import assert from "node:assert/strict";

import { buildSalesAssistantPayload } from "../utils/chatSalesAssistant.js";

test("buildSalesAssistantPayload recommends a matching package and qualification question", () => {
  const payload = buildSalesAssistantPayload({
    message: "I want a Serengeti safari for July with my partner",
    tours: [
      {
        _id: "tour-1",
        title: "Serengeti Migration Escape",
        location: "Serengeti",
        tourType: "Safari",
        category: "Luxury",
        price: 2400,
      },
      {
        _id: "tour-2",
        title: "Kilimanjaro Summit Route",
        location: "Kilimanjaro",
        tourType: "Trekking",
        category: "Adventure",
        price: 1800,
      },
    ],
  });

  assert.ok(payload.summary.includes("Serengeti Migration Escape"));
  assert.equal(payload.quickActions.length > 0, true);
  assert.ok(payload.quickActions.some((action) => action.href === "/plan-my-trip"));
  assert.ok(payload.qualificationQuestion.length > 0);
});

test("buildSalesAssistantPayload falls back to trip-planning CTA when no tour matches", () => {
  const payload = buildSalesAssistantPayload({
    message: "We need a custom honeymoon with safari and beach time",
    tours: [],
  });

  assert.ok(payload.summary.includes("custom"));
  assert.equal(payload.quickActions[0].href, "/plan-my-trip");
});
