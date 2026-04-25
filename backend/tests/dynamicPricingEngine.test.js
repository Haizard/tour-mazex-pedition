import test from "node:test";
import assert from "node:assert/strict";

import { calculateDynamicPricePreview } from "../utils/dynamicPricingEngine.js";

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
