import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelConciergeRecommendations,
  buildHotelConciergeRequest,
} from "../utils/hotelAiConcierge.js";

test("buildHotelConciergeRequest normalizes traveler preference inputs", () => {
  const request = buildHotelConciergeRequest({
    destination: " Arusha ",
    accommodationType: " Lodge ",
    amenities: [" Pool ", "", "Airport transfer"],
    tripIntent: "pre-safari",
  });

  assert.deepEqual(request, {
    destination: "arusha",
    accommodationType: "lodge",
    amenities: ["pool", "airport transfer"],
    tripIntent: "pre-safari",
  });
});

test("buildHotelConciergeRecommendations ranks only public hotels using grounded fields", () => {
  const recommendations = buildHotelConciergeRecommendations(
    [
      {
        _id: "hotel-1",
        name: "Arusha Garden Lodge",
        slug: "arusha-garden-lodge",
        destination: "Arusha",
        accommodationType: "lodge",
        amenities: ["Pool", "Airport transfer"],
        averageRating: 4.7,
        reviewCount: 18,
        published: true,
        marketplaceVisible: true,
      },
      {
        _id: "hotel-2",
        name: "City Hotel",
        slug: "city-hotel",
        destination: "Nairobi",
        accommodationType: "hotel",
        amenities: ["Gym"],
        published: true,
        marketplaceVisible: true,
      },
      {
        _id: "hotel-3",
        name: "Hidden Draft Camp",
        destination: "Arusha",
        accommodationType: "camp",
        amenities: ["Pool"],
        published: false,
        marketplaceVisible: true,
      },
    ],
    { destination: "Arusha", accommodationType: "lodge", amenities: ["pool"] }
  );

  assert.equal(recommendations.length, 2);
  assert.equal(recommendations[0].hotelId, "hotel-1");
  assert.equal(recommendations[0].fitScore > recommendations[1].fitScore, true);
  assert.equal(recommendations.some((item) => item.hotelId === "hotel-3"), false);
  assert.equal(recommendations[0].reasons.includes("Matches Arusha"), true);
  assert.equal(recommendations[0].reasons.includes("Offers lodge style accommodation"), true);
  assert.equal(recommendations[0].guardrail.includes("availability"), true);
  assert.equal(recommendations[0].guardrail.includes("prices"), true);
});
