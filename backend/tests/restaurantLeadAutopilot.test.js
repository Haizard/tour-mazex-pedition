import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantLeadAutopilot,
  enhanceRestaurantInquiryAutomation,
} from "../utils/restaurantLeadAutopilot.js";

test("buildRestaurantLeadAutopilot classifies direct dining requests and suggests reply guidance", () => {
  const autopilot = buildRestaurantLeadAutopilot({
    restaurantId: "restaurant-1",
    restaurantName: "Savanna Table",
    restaurantIntentType: "direct-restaurant",
    message: "I need a farewell dinner for 6 guests with vegetarian options.",
  });

  assert.equal(autopilot.intentLabel, "Direct dining");
  assert.equal(autopilot.urgency, "hot");
  assert.equal(autopilot.classifications.includes("direct-dining"), true);
  assert.equal(autopilot.classifications.includes("group-dining"), true);
  assert.equal(autopilot.classifications.includes("dietary-sensitive"), true);
  assert.equal(
    autopilot.nextBestAction,
    "Confirm dietary requirements, final guest count, and service timing before proposing the restaurant."
  );
  assert.equal(autopilot.replyHints.length >= 2, true);
  assert.equal(autopilot.requiresHumanReview, false);
});

test("buildRestaurantLeadAutopilot flags itinerary dining leads that need manual review", () => {
  const autopilot = buildRestaurantLeadAutopilot({
    restaurantIntentType: "itinerary-add-on",
    message:
      "Please include a restaurant that can handle vegan and nut-free travelers near the route after the crater.",
  });

  assert.equal(autopilot.intentLabel, "Itinerary dining add-on");
  assert.equal(autopilot.urgency, "warm");
  assert.equal(autopilot.classifications.includes("itinerary-dining"), true);
  assert.equal(autopilot.classifications.includes("dietary-sensitive"), true);
  assert.equal(autopilot.classifications.includes("route-sensitive"), true);
  assert.equal(autopilot.requiresHumanReview, true);
  assert.equal(
    autopilot.nextBestAction,
    "Confirm dietary needs, route timing, and whether this stop is essential or optional inside the itinerary."
  );
});

test("buildRestaurantLeadAutopilot falls back gracefully when little dining context is provided", () => {
  const autopilot = buildRestaurantLeadAutopilot({
    message: "Can you recommend a place for dinner?",
  });

  assert.equal(autopilot.intentLabel, "Restaurant lead");
  assert.deepEqual(autopilot.classifications, []);
  assert.equal(autopilot.urgency, "warm");
  assert.equal(autopilot.requiresHumanReview, false);
  assert.equal(
    autopilot.nextBestAction,
    "Confirm the dining date, guest count, and whether this is a direct booking or part of a wider itinerary."
  );
});

test("enhanceRestaurantInquiryAutomation returns merged automation plus restaurant autopilot", () => {
  const enhanced = enhanceRestaurantInquiryAutomation(
    {
      summary: "Lead looks qualified.",
      followUpMessage: "Thanks for your interest.",
    },
    {
      restaurantId: "restaurant-1",
      restaurantName: "Savanna Table",
      restaurantIntentType: "direct-restaurant",
      message: "I need a farewell dinner for 6 guests with vegetarian options.",
    }
  );

  assert.equal(enhanced.restaurantAutopilot.intentLabel, "Direct dining");
  assert.equal(enhanced.summary.includes("Restaurant intent: Direct dining."), true);
  assert.equal(enhanced.followUpMessage.includes("Reference Savanna Table directly"), true);
});
