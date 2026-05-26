import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHospitalityRecommendationQuery,
  getHospitalityConfidenceLabel,
  getHospitalityRecommendationLabel,
  normalizeHospitalityRecommendations,
} from "./hospitalityIntelligenceState.js";

test("buildHospitalityRecommendationQuery shapes hotel detail request params", () => {
  assert.deepEqual(
    buildHospitalityRecommendationQuery({
      sourceType: " hotel ",
      sourceSlug: " arusha-garden-lodge ",
      surface: " hotel-detail ",
      destination: " Arusha ",
      sessionKey: " traveler_123 ",
    }),
    {
      sourceType: "hotel",
      sourceSlug: "arusha-garden-lodge",
      sourceId: "",
      surface: "hotel-detail",
      destination: "Arusha",
      region: "",
      sessionKey: "traveler_123",
    }
  );
});

test("normalizeHospitalityRecommendations preserves fit, disclaimer, and sponsored labels", () => {
  const cards = normalizeHospitalityRecommendations([
    {
      recommendationId: "hotel:1:restaurant:2",
      targetType: "restaurant",
      title: "Garden Table",
      url: "/discover/restaurants/garden-table",
      fitScore: 82,
      reasons: ["Good dinner timing fit."],
      sponsored: true,
      disclaimer: "AI recommendation only.",
      attribution: { sponsored: true },
    },
  ]);

  assert.equal(cards[0].label, "Dining add-on");
  assert.equal(cards[0].sponsoredLabel, "Sponsored");
  assert.equal(cards[0].confidenceLabel, "High fit");
  assert.equal(cards[0].primaryReason, "Good dinner timing fit.");
  assert.equal(cards[0].disclaimer, "AI recommendation only.");
});

test("normalizeHospitalityRecommendations safely handles malformed rows", () => {
  assert.doesNotThrow(() => normalizeHospitalityRecommendations([null, {}, "bad-row"]));

  const cards = normalizeHospitalityRecommendations([null, {}, "bad-row"]);

  assert.deepEqual(
    cards.map((card) => card.id),
    [
      "hospitality-recommendation-0",
      "hospitality-recommendation-1",
      "hospitality-recommendation-2",
    ]
  );
  assert.equal(new Set(cards.map((card) => card.id)).size, 3);
  assert.equal(
    cards[0].disclaimer,
    "AI recommendation only. Confirm availability, pricing, and commitments before booking."
  );
});

test("getHospitalityRecommendationLabel returns useful type labels", () => {
  assert.equal(getHospitalityRecommendationLabel("hotel"), "Stay add-on");
  assert.equal(getHospitalityRecommendationLabel("restaurant"), "Dining add-on");
  assert.equal(getHospitalityRecommendationLabel("tour"), "Trip add-on");
});

test("getHospitalityConfidenceLabel returns threshold labels", () => {
  assert.equal(getHospitalityConfidenceLabel(70), "High fit");
  assert.equal(getHospitalityConfidenceLabel(45), "Good fit");
  assert.equal(getHospitalityConfidenceLabel(44), "Emerging fit");
});
