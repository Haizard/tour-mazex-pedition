import assert from "node:assert/strict";
import test from "node:test";

import { buildTripComparisonFields } from "./tripComparisonUtils.js";

test("buildTripComparisonFields formats availability and fallback copy", () => {
  const withDate = buildTripComparisonFields({
    price: 3200,
    duration: "6 days",
    location: "Serengeti",
    marketplaceAvailability: [
      { status: "limited", date: "2026-08-10T00:00:00.000Z", remainingSpots: 3 },
    ],
    category: "Luxury",
    marketplace: { averageRating: 4.9, reviewCount: 12 },
    inclusions: ["Guide", "Transfers", "Park fees"],
    destinationsVisited: ["Serengeti", "Ngorongoro"],
  });

  assert.equal(withDate[3][0], "Next departure");
  assert.match(withDate[3][1], /limited/i);
  assert.match(withDate[3][1], /3 spots/i);

  const fallback = buildTripComparisonFields({});
  assert.equal(fallback[3][1], "Request next available dates");
  assert.equal(fallback[5][1], "New feedback profile");
});
