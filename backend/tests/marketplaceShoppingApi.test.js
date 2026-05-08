import test from "node:test";
import assert from "node:assert/strict";

import {
  buildComparisonPayload,
  buildSavedTripsPayload,
  createComparisonSetRecord,
  createSavedTripListRecord,
} from "../routes/marketplaceEngagementRoutes.js";
import { buildMarketplaceRegionSummaries } from "../utils/marketplaceRegionAggregation.js";

test("createSavedTripListRecord deduplicates selected tours and keeps traveler identity", async () => {
  const result = await createSavedTripListRecord(
    {
      sessionKey: "sess_1",
      email: "traveler@example.com",
      selectedTourIds: ["tour1", "tour2", "tour1"],
    },
    {
      resolveIdentity: async () => ({ _id: "identity_1" }),
      upsertList: async (payload) => payload,
    }
  );

  assert.equal(result.travelerIdentityId, "identity_1");
  assert.deepEqual(result.selectedTourIds, ["tour1", "tour2"]);
});

test("createComparisonSetRecord caps the compare set at four unique tours", async () => {
  const result = await createComparisonSetRecord(
    {
      sessionKey: "sess_2",
      selectedTourIds: ["tour1", "tour2", "tour3", "tour4", "tour5", "tour1"],
    },
    {
      upsertSet: async (payload) => payload,
    }
  );

  assert.deepEqual(result.selectedTourIds, ["tour1", "tour2", "tour3", "tour4"]);
});

test("buildSavedTripsPayload hydrates saved trips for the marketplace shortlist", () => {
  const payload = buildSavedTripsPayload({
    savedTripList: {
      selectedTourIds: ["tour1", "tour2"],
      updatedAt: "2026-05-08T10:00:00.000Z",
    },
    tours: [
      { _id: "tour1", title: "Safari Alpha" },
      { _id: "tour2", title: "Safari Beta" },
    ],
  });

  assert.equal(payload.count, 2);
  assert.equal(payload.tours[0].title, "Safari Alpha");
});

test("buildComparisonPayload returns tours in saved comparison order", () => {
  const payload = buildComparisonPayload({
    comparisonSet: {
      selectedTourIds: ["tour2", "tour1"],
      updatedAt: "2026-05-08T10:30:00.000Z",
    },
    tours: [
      { _id: "tour1", title: "Safari Alpha" },
      { _id: "tour2", title: "Safari Beta" },
    ],
  });

  assert.equal(payload.count, 2);
  assert.equal(payload.tours[0].title, "Safari Beta");
  assert.equal(payload.tours[1].title, "Safari Alpha");
});

test("buildMarketplaceRegionSummaries groups tours into region cards with destination counts", () => {
  const regions = buildMarketplaceRegionSummaries([
    {
      _id: "tour1",
      title: "Kili Route",
      location: "Kilimanjaro",
      destinationsVisited: ["Moshi", "Shira Camp"],
      price: 2200,
      tenantId: { _id: "tenant1", name: "Climb Co", slug: "climb-co" },
    },
    {
      _id: "tour2",
      title: "Serengeti Loop",
      location: "Northern Circuit",
      destinationsVisited: ["Serengeti", "Ngorongoro"],
      price: 3400,
      tenantId: { _id: "tenant2", name: "Safari Co", slug: "safari-co" },
    },
    {
      _id: "tour3",
      title: "Another Kili",
      location: "Kilimanjaro",
      destinationsVisited: ["Mweka Gate"],
      price: 2500,
      tenantId: { _id: "tenant1", name: "Climb Co", slug: "climb-co" },
    },
  ]);

  assert.equal(regions.length, 2);
  assert.equal(regions[0].label, "Kilimanjaro");
  assert.equal(regions[0].tourCount, 2);
  assert.equal(regions[0].startingPrice, 2200);
  assert.equal(regions[0].operatorCount, 1);
  assert.ok(regions[0].destinations.includes("Moshi"));
});

