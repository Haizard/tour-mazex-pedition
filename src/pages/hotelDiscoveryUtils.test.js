import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHotelInquiryPayload,
  buildHotelIntentOptions,
  countActiveHotelFilters,
  filterHotelCards,
  sortHotelCards,
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

test("sortHotelCards orders sponsored, rating, and newest hotel views", () => {
  const hotels = [
    { name: "New Hotel", sponsoredPlacement: false, averageRating: 4.2, reviewCount: 4, createdAt: "2026-05-01T00:00:00.000Z" },
    { name: "Sponsored Hotel", sponsoredPlacement: true, averageRating: 4.1, reviewCount: 3, createdAt: "2026-04-01T00:00:00.000Z" },
    { name: "Top Rated Hotel", sponsoredPlacement: false, averageRating: 4.9, reviewCount: 18, createdAt: "2026-03-01T00:00:00.000Z" },
  ];

  assert.deepEqual(sortHotelCards(hotels, "featured").map((hotel) => hotel.name), [
    "Sponsored Hotel",
    "Top Rated Hotel",
    "New Hotel",
  ]);
  assert.deepEqual(sortHotelCards(hotels, "rating").map((hotel) => hotel.name), [
    "Top Rated Hotel",
    "New Hotel",
    "Sponsored Hotel",
  ]);
  assert.deepEqual(sortHotelCards(hotels, "newest").map((hotel) => hotel.name), [
    "New Hotel",
    "Sponsored Hotel",
    "Top Rated Hotel",
  ]);
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

test("buildHotelIntentOptions exposes direct and itinerary conversion paths", () => {
  const options = buildHotelIntentOptions({
    _id: "hotel-1",
    name: "Arusha Garden Lodge",
    destination: "Arusha",
    accommodationType: "lodge",
  });

  assert.equal(options.length, 2);
  assert.equal(options[0].intentType, "direct-hotel");
  assert.equal(options[0].payload.hotelIntentType, "direct-hotel");
  assert.equal(options[0].payload.message.includes("directly about Arusha Garden Lodge"), true);
  assert.equal(options[1].intentType, "itinerary-add-on");
  assert.equal(options[1].payload.hotelIntentType, "itinerary-add-on");
});

test("HotelDetail renders selectable hotel inquiry intent controls", async () => {
  const source = await readFile(new URL("./HotelDetail.jsx", import.meta.url), "utf8");

  assert.equal(source.includes("buildHotelIntentOptions"), true);
  assert.equal(source.includes("selectedIntentId"), true);
  assert.equal(source.includes("selectedIntent.payload.hotelIntentType"), true);
});

test("HotelDiscovery renders a public sort selector", async () => {
  const source = await readFile(new URL("./HotelDiscovery.jsx", import.meta.url), "utf8");

  assert.equal(source.includes("sortHotelCards"), true);
  assert.equal(source.includes('name="sort"'), true);
  assert.equal(source.includes('value="rating"'), true);
});
