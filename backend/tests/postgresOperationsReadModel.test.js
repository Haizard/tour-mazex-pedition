import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeOperationsRecentRows,
  normalizeOperationsSummaryRows,
} from "../utils/postgresOperationsReadModel.js";

test("normalizeOperationsSummaryRows converts counts to numbers", () => {
  const rows = normalizeOperationsSummaryRows([
    {
      record_type: "guides",
      total_records: "4",
      active_records: "2",
    },
  ]);

  assert.deepEqual(rows, [
    {
      recordType: "guides",
      totalRecords: 4,
      activeRecords: 2,
    },
  ]);
});

test("normalizeOperationsRecentRows returns operational feed records", () => {
  const rows = normalizeOperationsRecentRows([
    {
      record_type: "airport-pickups",
      source_id: "pickup-1",
      tenant_id: "tenant-1",
      label: "Traveler One",
      stage: "scheduled",
      supporting_label: "JRO",
      updated_at: "2026-04-28T15:00:00.000Z",
    },
  ]);

  assert.deepEqual(rows, [
    {
      recordType: "airport-pickups",
      sourceId: "pickup-1",
      tenantId: "tenant-1",
      label: "Traveler One",
      stage: "scheduled",
      supportingLabel: "JRO",
      updatedAt: "2026-04-28T15:00:00.000Z",
    },
  ]);
});
