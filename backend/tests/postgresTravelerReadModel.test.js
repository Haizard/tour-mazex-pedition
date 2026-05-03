import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeRecentTravelerRows,
  normalizeTravelerSummaryRows,
} from "../utils/postgresTravelerReadModel.js";

test("normalizeTravelerSummaryRows formats traveler stage metrics", () => {
  const rows = normalizeTravelerSummaryRows([
    {
      lead_stage: "qualified",
      total_records: "6",
      average_lead_score: "88.25",
    },
  ]);

  assert.deepEqual(rows, [
    {
      leadStage: "qualified",
      totalRecords: 6,
      averageLeadScore: 88.25,
    },
  ]);
});

test("normalizeRecentTravelerRows returns traveler feed items", () => {
  const rows = normalizeRecentTravelerRows([
    {
      source_id: "inquiry-1",
      tenant_id: "tenant-1",
      traveler_name: "Amina Said",
      destinations: ["Serengeti"],
      lead_stage: "new",
      status: "Pending",
      source_channel: "website",
      lead_score: "72",
      lead_temperature: "warm",
      updated_at: "2026-04-28T12:00:00.000Z",
    },
  ]);

  assert.deepEqual(rows, [
    {
      sourceId: "inquiry-1",
      tenantId: "tenant-1",
      travelerName: "Amina Said",
      destinations: ["Serengeti"],
      leadStage: "new",
      status: "Pending",
      sourceChannel: "website",
      leadScore: 72,
      leadTemperature: "warm",
      updatedAt: "2026-04-28T12:00:00.000Z",
    },
  ]);
});
