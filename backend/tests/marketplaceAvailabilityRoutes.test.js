import test from "node:test";
import assert from "node:assert/strict";

import {
  addMarketplaceAvailabilityEntry,
  applyBulkMarketplaceAvailabilityAction,
  deleteMarketplaceAvailabilityEntry,
  updateMarketplaceAvailabilityEntry,
} from "../routes/marketplaceEngagementRoutes.js";

test("addMarketplaceAvailabilityEntry upserts a departure entry", () => {
  const tour = addMarketplaceAvailabilityEntry(
    {
      marketplaceAvailability: [{ date: "2026-08-10", status: "available", published: true }],
    },
    {
      date: "2026-08-10",
      status: "limited",
      remainingSpots: 2,
      published: true,
    }
  );

  assert.equal(tour.marketplaceAvailability.length, 1);
  assert.equal(tour.marketplaceAvailability[0].status, "limited");
  assert.equal(tour.marketplaceAvailability[0].remainingSpots, 2);
});

test("updateMarketplaceAvailabilityEntry patches an existing departure", () => {
  const tour = updateMarketplaceAvailabilityEntry(
    {
      marketplaceAvailability: [{ date: "2026-09-05", status: "available", published: true }],
    },
    "2026-09-05",
    { published: false, note: "Paused for confirmation" }
  );

  assert.equal(tour.marketplaceAvailability[0].published, false);
  assert.equal(tour.marketplaceAvailability[0].note, "Paused for confirmation");
});

test("deleteMarketplaceAvailabilityEntry removes one departure by date", () => {
  const tour = deleteMarketplaceAvailabilityEntry(
    {
      marketplaceAvailability: [
        { date: "2026-10-01", status: "available", published: true },
        { date: "2026-10-08", status: "available", published: true },
      ],
    },
    "2026-10-01"
  );

  assert.equal(tour.marketplaceAvailability.length, 1);
  assert.equal(String(tour.marketplaceAvailability[0].date).slice(0, 10), "2026-10-08");
});

test("applyBulkMarketplaceAvailabilityAction updates selected rows only", () => {
  const tour = applyBulkMarketplaceAvailabilityAction(
    {
      marketplaceAvailability: [
        { date: "2026-11-01", status: "available", remainingSpots: 6, published: true },
        { date: "2026-11-08", status: "available", remainingSpots: 4, published: true },
      ],
    },
    {
      action: "set-status",
      status: "limited",
      dateKeys: ["2026-11-08"],
    }
  );

  assert.equal(tour.marketplaceAvailability[0].status, "available");
  assert.equal(tour.marketplaceAvailability[1].status, "limited");
});
