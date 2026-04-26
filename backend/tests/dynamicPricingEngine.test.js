import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDynamicPricingImpactBoard,
  calculateDynamicPricePreview,
  doesDynamicPricingRuleMatchTour,
} from "../utils/dynamicPricingEngine.js";

test("calculateDynamicPricePreview applies season, demand, and occupancy adjustments", () => {
  const result = calculateDynamicPricePreview({
    basePrice: 2000,
    seasonMultiplier: 1.1,
    demandMultiplier: 1.05,
    occupancyMultiplier: 1.08,
  });

  assert.equal(result.finalPrice, 2495);
  assert.equal(result.adjustmentPercent, 24.74);
});

test("calculateDynamicPricePreview respects manual override floor", () => {
  const result = calculateDynamicPricePreview({
    basePrice: 1200,
    seasonMultiplier: 0.9,
    demandMultiplier: 0.95,
    occupancyMultiplier: 0.92,
    minimumPrice: 1100,
  });

  assert.equal(result.finalPrice, 1100);
  assert.equal(result.minimumApplied, true);
});

test("doesDynamicPricingRuleMatchTour links rules to matching packages", () => {
  const result = doesDynamicPricingRuleMatchTour(
    { routeLabel: "serengeti" },
    { title: "Ultimate Serengeti Explorer", location: "Northern Circuit" }
  );

  assert.equal(result, true);
});

test("buildDynamicPricingImpactBoard previews adjusted live package prices", () => {
  const result = buildDynamicPricingImpactBoard(
    [
      {
        _id: "rule-1",
        ruleName: "Peak Serengeti",
        routeLabel: "serengeti",
        basePrice: 2000,
        seasonMultiplier: 1.1,
        demandMultiplier: 1.05,
        occupancyMultiplier: 1.08,
        minimumPrice: 0,
        status: "active",
      },
    ],
    [
      {
        _id: "tour-1",
        title: "Ultimate Serengeti Explorer",
        location: "Northern Circuit",
        price: 2400,
      },
    ]
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].impactedTourCount, 1);
  assert.equal(result[0].matchedTours[0].adjustedPrice > result[0].matchedTours[0].basePrice, true);
});
