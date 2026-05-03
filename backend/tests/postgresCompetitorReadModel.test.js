import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeCompetitorRecentRows,
  normalizeCompetitorSummaryRows,
} from "../utils/postgresCompetitorReadModel.js";

test("normalizeCompetitorSummaryRows returns competitor status totals", () => {
  const rows = normalizeCompetitorSummaryRows([
    {
      status: "active",
      total_records: "2",
      average_price_usd: "4100.50",
    },
  ]);

  assert.deepEqual(rows, [
    {
      status: "active",
      totalRecords: 2,
      averagePriceUsd: 4100.5,
    },
  ]);
});

test("normalizeCompetitorRecentRows returns intelligence feed items", () => {
  const rows = normalizeCompetitorRecentRows([
    {
      source_id: "insight-1",
      tenant_id: "tenant-1",
      competitor_name: "Safari Rival",
      status: "active",
      focus_route: "Serengeti",
      observed_price_usd: "4200.00",
      updated_at: "2026-04-28T18:00:00.000Z",
    },
  ]);

  assert.deepEqual(rows, [
    {
      sourceId: "insight-1",
      tenantId: "tenant-1",
      competitorName: "Safari Rival",
      status: "active",
      focusRoute: "Serengeti",
      observedPriceUsd: 4200,
      updatedAt: "2026-04-28T18:00:00.000Z",
    },
  ]);
});
