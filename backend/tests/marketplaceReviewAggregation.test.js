import test from "node:test";
import assert from "node:assert/strict";

import { buildMarketplaceReviewSummary } from "../utils/marketplaceReviewAggregation.js";

test("buildMarketplaceReviewSummary returns rating average, distribution, and top sentiment tags", () => {
  const summary = buildMarketplaceReviewSummary([
    {
      rating: 5,
      sentimentTags: ["guide", "food"],
      verificationType: "booking",
      visibilityState: "public",
      travelerType: "Couple",
      travelMonth: "July",
    },
    {
      rating: 4,
      sentimentTags: ["guide"],
      verificationType: "booking",
      visibilityState: "public",
      travelerType: "Family",
      travelMonth: "July",
    },
    {
      rating: 3,
      sentimentTags: ["timing"],
      verificationType: "inquiry",
      visibilityState: "public",
      travelerType: "Solo",
      travelMonth: "August",
    },
  ]);

  assert.equal(summary.averageRating, 4.5);
  assert.equal(summary.reviewCount, 2);
  assert.deepEqual(summary.ratingDistribution, { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 });
  assert.deepEqual(summary.topSentimentTags, ["guide", "food"]);
  assert.deepEqual(summary.sentimentHighlights, [
    { label: "guide", count: 2 },
    { label: "food", count: 1 },
  ]);
  assert.deepEqual(summary.verificationBreakdown, { booking: 2, inquiry: 0 });
  assert.deepEqual(summary.travelerTypeBreakdown, [
    { label: "Couple", count: 1 },
    { label: "Family", count: 1 },
  ]);
  assert.deepEqual(summary.travelMonthBreakdown, [{ label: "July", count: 2 }]);
});
