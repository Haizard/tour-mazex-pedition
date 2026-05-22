import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelConciergePreferenceDraft,
  buildHotelConciergeRequestPayload,
} from "./hotelConciergeState.js";

test("buildHotelConciergePreferenceDraft seeds traveler preferences from the current hotel", () => {
  const draft = buildHotelConciergePreferenceDraft({
    destination: "Arusha",
    accommodationType: "lodge",
    amenities: ["Pool", "Airport transfer", "Spa"],
  });

  assert.equal(draft.destination, "Arusha");
  assert.equal(draft.accommodationType, "lodge");
  assert.deepEqual(draft.amenities, ["Pool", "Airport transfer"]);
  assert.equal(draft.tripIntent, "hotel-fit");
});

test("buildHotelConciergeRequestPayload normalizes amenity text into a grounded concierge request", () => {
  const payload = buildHotelConciergeRequestPayload({
    destination: " Arusha ",
    accommodationType: " Lodge ",
    amenitiesText: "Pool, Airport transfer, Pool",
    tripIntent: "direct-hotel",
  });

  assert.deepEqual(payload, {
    destination: "Arusha",
    accommodationType: "Lodge",
    amenities: ["Pool", "Airport transfer"],
    tripIntent: "direct-hotel",
  });
});
