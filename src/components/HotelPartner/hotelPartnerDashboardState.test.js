import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPartnerHotelUpdatePayload,
  createEmptyPartnerHotelDraft,
  filterPartnerHotels,
} from "./hotelPartnerDashboardState.js";

test("createEmptyPartnerHotelDraft starts with profile-only fields", () => {
  const draft = createEmptyPartnerHotelDraft();

  assert.deepEqual(Object.keys(draft).sort(), [
    "amenities",
    "description",
    "destination",
    "name",
    "photos",
    "region",
    "roomStyleSummary",
    "summary",
    "trustSummary",
  ]);
});

test("buildPartnerHotelUpdatePayload strips tenant-admin approval fields", () => {
  const payload = buildPartnerHotelUpdatePayload({
    name: "Arusha Garden Lodge",
    amenities: "Pool, WiFi",
    photos: "https://example.com/one.jpg\nhttps://example.com/two.jpg",
    published: true,
    marketplaceVisible: true,
  });

  assert.deepEqual(payload.amenities, ["Pool", "WiFi"]);
  assert.deepEqual(payload.photos, [
    "https://example.com/one.jpg",
    "https://example.com/two.jpg",
  ]);
  assert.equal("published" in payload, false);
  assert.equal("marketplaceVisible" in payload, false);
});

test("filterPartnerHotels searches assigned hotel records", () => {
  const hotels = [
    { name: "Arusha Garden Lodge", destination: "Arusha" },
    { name: "Serengeti River Camp", destination: "Serengeti" },
  ];

  assert.deepEqual(filterPartnerHotels(hotels, "river").map((hotel) => hotel.name), [
    "Serengeti River Camp",
  ]);
});
