import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelInquiryPayload,
  countActiveHotelFilters,
  filterHotelCards,
} from "./hotelDiscoveryUtils.js";

test("countActiveHotelFilters ignores default sort", () => {
  assert.equal(
    countActiveHotelFilters({
      q: "arusha",
      destination: "",
      accommodationType: "",
      amenity: "",
      sort: "featured",
    }),
    1
  );
});

test("filterHotelCards filters by destination, accommodation type, and amenity", () => {
  const hotels = filterHotelCards(
    [
      { name: "Arusha Garden Lodge", destination: "Arusha", accommodationType: "lodge", amenities: ["Pool"] },
      { name: "City Hotel", destination: "Nairobi", accommodationType: "hotel", amenities: ["Gym"] },
    ],
    { destination: "arusha", accommodationType: "lodge", amenity: "pool" }
  );

  assert.equal(hotels.length, 1);
  assert.equal(hotels[0].name, "Arusha Garden Lodge");
});

test("buildHotelInquiryPayload preserves hotel context and intent", () => {
  const payload = buildHotelInquiryPayload({
    hotel: { _id: "hotel-1", name: "Arusha Garden Lodge", destination: "Arusha", operator: { id: "tenant-1", slug: "maz" } },
    intentType: "itinerary-add-on",
    traveler: { firstName: "Amina", lastName: "Said" },
  });

  assert.equal(payload.hotelId, "hotel-1");
  assert.equal(payload.hotelIntentType, "itinerary-add-on");
  assert.equal(payload.operatorTenantId, "tenant-1");
  assert.equal(payload.sourceChannel, "global-marketplace");
  assert.equal(payload.campaignLabel, "hotel_hotel-1");
});
