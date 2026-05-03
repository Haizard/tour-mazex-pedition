import test from "node:test";
import assert from "node:assert/strict";

import { summarizeCompetitorInsight } from "../utils/competitorIntelligence.js";

test("summarizeCompetitorInsight highlights active competitor tracking with market trend details", () => {
  const result = summarizeCompetitorInsight({
    competitorName: "Savanna Trails",
    status: "active",
    focusRoute: "Serengeti migration",
    marketTrend: "Rising shoulder-season demand",
    observedPriceUsd: 2450,
  });

  assert.equal(result.badgeLabel, "Active");
  assert.equal(result.summary.includes("Savanna Trails"), true);
  assert.equal(result.summary.includes("Serengeti migration"), true);
  assert.equal(result.summary.includes("Rising shoulder-season demand"), true);
});

test("summarizeCompetitorInsight highlights archived intelligence notes", () => {
  const result = summarizeCompetitorInsight({
    competitorName: "Coastal Explorer",
    status: "archived",
  });

  assert.equal(result.badgeLabel, "Archived");
  assert.equal(result.summary.includes("archived"), true);
});
