import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCompetitorInsightLookup,
  buildCompetitorInsightView,
  buildCompetitorInsightDelete,
  buildCompetitorInsightUpsert,
} from "../utils/postgresCompetitorRecords.js";

test("buildCompetitorInsightUpsert targets competitor_insight_records", () => {
  const statement = buildCompetitorInsightUpsert({
    _id: "insight-1",
    tenantId: "tenant-1",
    competitorName: "Safari Rival",
    status: "active",
  });

  assert.equal(statement.text.includes("competitor_insight_records"), true);
  assert.equal(statement.values[0], "insight-1");
  assert.equal(statement.values[2], "Safari Rival");
});

test("buildCompetitorInsightDelete targets competitor_insight_records", () => {
  const statement = buildCompetitorInsightDelete("insight-1", "tenant-1");

  assert.equal(statement.text.includes("competitor_insight_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["insight-1", "tenant-1"]);
});

test("buildCompetitorInsightLookup targets one competitor record", () => {
  const statement = buildCompetitorInsightLookup("insight-1", "tenant-1");

  assert.equal(statement.text.includes("competitor_insight_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["insight-1", "tenant-1"]);
});

test("buildCompetitorInsightView reconstructs the competitor payload", () => {
  const insight = buildCompetitorInsightView({
    source_id: "insight-1",
    tenant_id: "tenant-1",
    competitor_name: "Safari Rival",
    market_region: "EA",
    focus_route: "Northern Circuit",
    observed_price_usd: 4200,
    currency: "USD",
    market_trend: "up",
    offer_summary: "Luxury safari",
    source_label: "OTA",
    intelligence_date: "2026-05-01T00:00:00.000Z",
    strength_signals: ["brand"],
    risk_signals: ["pricing"],
    status: "active",
    notes: "Watch closely",
  });

  assert.equal(insight._id, "insight-1");
  assert.equal(insight.competitorName, "Safari Rival");
  assert.equal(insight.observedPriceUsd, 4200);
  assert.equal(insight.status, "active");
});
