import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantDirectInquirySubmission,
  createRestaurantDirectInquiryInitialState,
} from "./restaurantInquiryUtils.js";

test("createRestaurantDirectInquiryInitialState seeds a restaurant-aware message", () => {
  const state = createRestaurantDirectInquiryInitialState({
    restaurant: { name: "Savanna Table" },
  });

  assert.equal(state.contactPreference, "whatsapp");
  assert.equal(state.message.includes("Savanna Table"), true);
});

test("buildRestaurantDirectInquirySubmission keeps restaurant intent fields", () => {
  const payload = buildRestaurantDirectInquirySubmission({
    restaurant: {
      _id: "restaurant-1",
      name: "Savanna Table",
      destination: "Arusha",
      operator: { id: "tenant-1", slug: "maz-expeditions" },
    },
    traveler: {
      firstName: "Asha",
      lastName: "Nuru",
      email: "asha@example.com",
      phone: "+255700000000",
      travelWhen: "July 2026",
      message: "Can you help with a farewell dinner?",
    },
  });

  assert.equal(payload.restaurantId, "restaurant-1");
  assert.equal(payload.restaurantIntentType, "direct-restaurant");
  assert.equal(payload.operatorTenantId, "tenant-1");
});
