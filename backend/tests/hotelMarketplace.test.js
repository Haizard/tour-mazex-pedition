import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelDiscoveryQuery,
  shapeHotelDetail,
  shapeHotelDiscoveryCard,
} from "../utils/hotelMarketplace.js";

test("shapeHotelDiscoveryCard exposes public hotel trust and fit fields", () => {
  const card = shapeHotelDiscoveryCard({
    _id: "hotel-1",
    name: "Arusha Garden Lodge",
    slug: "arusha-garden-lodge",
    summary: "Quiet lodge close to Arusha before safari.",
    destination: "Arusha",
    region: "Northern Tanzania",
    accommodationType: "lodge",
    amenities: ["Pool", "Airport transfer"],
    averageRating: 4.8,
    reviewCount: 21,
    sponsoredPlacement: true,
    availabilityCalendar: [
      { date: "2026-07-12", roomTypeCode: "deluxe", status: "open", availableUnits: 3, nightlyRate: 180 },
    ],
    roomInventory: [{ roomTypeCode: "deluxe", label: "Deluxe Room" }],
    tenantId: { _id: "tenant-1", name: "Maz Expeditions", slug: "maz-expeditions" },
  });

  assert.equal(card._id, "hotel-1");
  assert.equal(card.operator.name, "Maz Expeditions");
  assert.equal(card.trust.reviewLabel, "4.8/5 from 21 reviews");
  assert.equal(card.fitTags.includes("Lodge stay"), true);
  assert.equal(card.sponsoredPlacement, true);
  assert.equal(card.inventorySummary.fromRate, 180);
});

test("shapeHotelDetail keeps inquiry and itinerary intent context explicit", () => {
  const detail = shapeHotelDetail({
    _id: "hotel-1",
    name: "Arusha Garden Lodge",
    slug: "arusha-garden-lodge",
    destination: "Arusha",
    amenities: ["Pool"],
    availabilityCalendar: [
      { date: "2026-07-12", roomTypeCode: "deluxe", status: "open", availableUnits: 3, nightlyRate: 180 },
    ],
    tenantId: { _id: "tenant-1", name: "Maz Expeditions", slug: "maz-expeditions" },
  });

  assert.equal(detail.conversion.sendInquiry.hotelId, "hotel-1");
  assert.equal(detail.conversion.requestInItinerary.hotelIntentType, "itinerary-add-on");
  assert.equal(detail.aiConcierge.groundingWarning.includes("availability"), true);
  assert.equal(detail.inventorySummary.totalEntries, 1);
});

test("buildHotelDiscoveryQuery filters only published marketplace-visible hotels", () => {
  const query = buildHotelDiscoveryQuery({
    q: "garden",
    destination: "Arusha",
    accommodationType: "lodge",
    amenity: "pool",
  });

  assert.equal(query.published, true);
  assert.equal(query.marketplaceVisible, true);
  assert.equal(query.destination.$regex.test("Arusha"), true);
  assert.equal(query.accommodationType.$regex.test("Lodge"), true);
  assert.equal(query.amenities.$regex.test("Pool"), true);
  assert.equal(Array.isArray(query.$or), true);
});
