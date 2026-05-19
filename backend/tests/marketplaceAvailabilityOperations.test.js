import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMarketplaceAvailabilityRows,
  buildMarketplaceAvailabilityHealth,
} from "../utils/marketplaceAvailabilityOperations.js";

test("buildMarketplaceAvailabilityRows skips unpublished entries and flattens rows", () => {
  const rows = buildMarketplaceAvailabilityRows([
    {
      _id: "tour1",
      title: "Migration Safari",
      location: "Serengeti",
      isMarketplaceVisible: true,
      marketplaceAvailability: [
        { date: "2026-07-10", status: "available", remainingSpots: 4, published: true },
        { date: "2026-07-17", status: "limited", remainingSpots: 1, published: false },
      ],
      marketplaceAvailabilitySettings: { instantBookingEnabled: true },
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].dateKey, "2026-07-10");
  assert.equal(rows[0].instantReady, true);
});

test("buildMarketplaceAvailabilityHealth flags visible tours without published departures", () => {
  const warnings = buildMarketplaceAvailabilityHealth([
    {
      _id: "tour2",
      title: "Zanzibar Escape",
      isMarketplaceVisible: true,
      marketplaceAvailability: [],
      marketplaceAvailabilitySettings: { instantBookingEnabled: false },
    },
  ]);

  assert.equal(warnings[0].reason, "missing-published-dates");
});
