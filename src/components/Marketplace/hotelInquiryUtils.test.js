import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelDirectInquirySubmission,
  createHotelDirectInquiryInitialState,
} from "./hotelInquiryUtils.js";

test("createHotelDirectInquiryInitialState seeds a hotel-first traveler form", () => {
  const state = createHotelDirectInquiryInitialState({
    hotel: {
      name: "Arusha Garden Lodge",
    },
  });

  assert.equal(state.contactPreference, "whatsapp");
  assert.equal(state.adults, 1);
  assert.equal(state.tripLengthDays, 1);
  assert.equal(state.message.includes("Arusha Garden Lodge"), true);
});

test("buildHotelDirectInquirySubmission keeps hotel intent explicit while filling required planner defaults", () => {
  const payload = buildHotelDirectInquirySubmission({
    hotel: {
      _id: "hotel-1",
      name: "Arusha Garden Lodge",
      destination: "Arusha",
      accommodationType: "lodge",
      operator: {
        id: "tenant-1",
        slug: "maz-expeditions",
      },
    },
    traveler: {
      firstName: "Amina",
      lastName: "Said",
      email: "amina@example.com",
      phone: "+255700000000",
      travelWhen: "July 2026",
      adults: 2,
      tripLengthDays: 3,
      contactPreference: "email",
      message: "Please advise on room fit and transfer options.",
    },
  });

  assert.equal(payload.hotelIntentType, "direct-hotel");
  assert.equal(payload.hotelId, "hotel-1");
  assert.deepEqual(payload.destinations, ["Arusha"]);
  assert.deepEqual(payload.accommodationPreferences, [
    "Arusha Garden Lodge",
    "lodge",
  ]);
  assert.equal(payload.sleepingArrangement, "Flexible");
  assert.equal(payload.campaignLabel, "hotel_hotel-1");
  assert.equal(payload.operatorTenantId, "tenant-1");
  assert.equal(payload.operatorTenantSlug, "maz-expeditions");
});
