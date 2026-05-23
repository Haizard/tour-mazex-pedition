import test from "node:test";
import assert from "node:assert/strict";

import {
  getRestaurantAutopilotBadge,
  getRestaurantAutopilotSummary,
} from "./restaurantAutopilotState.js";

test("getRestaurantAutopilotBadge prefers the intent label", () => {
  assert.equal(
    getRestaurantAutopilotBadge({ intentLabel: "Direct dining" }),
    "Direct dining"
  );
  assert.equal(getRestaurantAutopilotBadge({}), "Restaurant lead");
});

test("getRestaurantAutopilotSummary normalizes urgency, next step, and reply hints", () => {
  const summary = getRestaurantAutopilotSummary({
    intentLabel: "Itinerary dining add-on",
    urgency: "hot",
    nextBestAction: "Confirm route timing.",
    replyHints: ["Ask for dietary needs.", "Confirm guest count."],
    classifications: ["itinerary-dining", "dietary-sensitive"],
    requiresHumanReview: true,
  });

  assert.deepEqual(summary, {
    title: "Itinerary dining add-on",
    badge: "Itinerary dining add-on",
    urgency: "hot",
    nextBestAction: "Confirm route timing.",
    replyHints: ["Ask for dietary needs.", "Confirm guest count."],
    classifications: ["itinerary-dining", "dietary-sensitive"],
    requiresHumanReview: true,
  });
});

test("getRestaurantAutopilotSummary supplies safe defaults", () => {
  assert.deepEqual(getRestaurantAutopilotSummary(), {
    title: "Restaurant lead",
    badge: "Restaurant lead",
    urgency: "warm",
    nextBestAction: "",
    replyHints: [],
    classifications: [],
    requiresHumanReview: false,
  });
});
