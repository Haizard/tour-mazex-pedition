import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHospitalityRecommendations,
  buildHospitalityAttribution,
} from "../utils/hospitalityIntelligence.js";

test("buildHospitalityRecommendations pairs a tour with hotels and restaurants by destination", () => {
  const result = buildHospitalityRecommendations({
    source: {
      type: "tour",
      id: "tour_1",
      name: "Serengeti Family Safari",
      destination: "Arusha",
      region: "Northern Circuit",
      travelerContext: { mealType: "dinner", dietaryFits: ["vegetarian"], tripStyle: "family" },
    },
    hotels: [
      {
        _id: "hotel_1",
        name: "Arusha Garden Lodge",
        slug: "arusha-garden-lodge",
        destination: "Arusha",
        region: "Northern Circuit",
        roomStyleSummary: "Family garden rooms",
        averageRating: 4.8,
        reviewCount: 32,
        sponsoredPlacement: true,
        published: true,
        marketplaceVisible: true,
      },
    ],
    restaurants: [
      {
        _id: "restaurant_1",
        name: "Garden Table",
        slug: "garden-table",
        destination: "Arusha",
        region: "Northern Circuit",
        mealTypes: ["dinner"],
        dietaryFits: ["vegetarian"],
        ambianceTags: ["family"],
        averageRating: 4.6,
        reviewCount: 18,
        published: true,
        marketplaceVisible: true,
      },
    ],
    sessionKey: "traveler_123",
    surface: "tour-detail",
  });

  assert.equal(result.recommendations.length, 2);
  assert.equal(result.recommendations[0].sourceType, "tour");
  assert.equal(result.recommendations[0].attribution.sessionKey, "traveler_123");
  assert.deepEqual(
    Object.keys(result.recommendations[0]).sort(),
    [
      "attribution",
      "confidence",
      "destination",
      "disclaimer",
      "fitScore",
      "reasons",
      "recommendationId",
      "region",
      "slug",
      "sourceId",
      "sourceType",
      "sponsored",
      "targetId",
      "targetType",
      "title",
      "trustNotes",
      "url",
    ]
  );
  assert.equal(result.recommendations.some((item) => item.targetType === "hotel"), true);
  assert.equal(result.recommendations.some((item) => item.targetType === "restaurant"), true);
  assert.equal(
    result.recommendations.every((item) => item.disclaimer.includes("recommendation")),
    true
  );
  assert.equal(
    result.recommendations.every((item) => item.disclaimer.includes("availability")),
    true
  );
  assert.equal(
    result.recommendations.every((item) => item.disclaimer.includes("pricing")),
    true
  );
});

test("buildHospitalityRecommendations filters unpublished public entities", () => {
  const result = buildHospitalityRecommendations({
    source: { type: "hotel", id: "hotel_1", name: "Known Hotel", destination: "Arusha" },
    restaurants: [
      { _id: "hidden", name: "Hidden", published: false, marketplaceVisible: true, destination: "Arusha" },
      { _id: "private", name: "Private", published: true, marketplaceVisible: false, destination: "Arusha" },
      { _id: "visible", name: "Visible", slug: "visible", published: true, marketplaceVisible: true, destination: "Arusha" },
    ],
  });

  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0].targetId, "visible");
});

test("buildHospitalityAttribution preserves recommendation revenue context", () => {
  assert.deepEqual(
    buildHospitalityAttribution({
      recommendationSource: "ai-hospitality-intelligence",
      sourceEntityType: "hotel",
      sourceEntityId: "hotel_1",
      recommendedEntityType: "restaurant",
      recommendedEntityId: "restaurant_1",
      surface: "hotel-detail",
      sponsored: true,
      sessionKey: "traveler_123",
    }),
    {
      recommendationSource: "ai-hospitality-intelligence",
      sourceEntityType: "hotel",
      sourceEntityId: "hotel_1",
      recommendedEntityType: "restaurant",
      recommendedEntityId: "restaurant_1",
      surface: "hotel-detail",
      sponsored: true,
      sessionKey: "traveler_123",
      inquiryId: null,
      bookingId: null,
      paymentId: null,
    }
  );
});
