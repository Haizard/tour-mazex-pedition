import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeEngagementSummaryRows,
  normalizeRecentEngagementRows,
} from "../utils/postgresEngagementReadModel.js";

test("normalizeEngagementSummaryRows formats engagement domain metrics", () => {
  const rows = normalizeEngagementSummaryRows([
    {
      domain: "feedback",
      total_records: "7",
      submitted_records: "5",
    },
    {
      domain: "follow-ups",
      total_records: "4",
      submitted_records: "2",
    },
  ]);

  assert.deepEqual(rows, [
    {
      domain: "feedback",
      totalRecords: 7,
      activeRecords: 5,
    },
    {
      domain: "follow-ups",
      totalRecords: 4,
      activeRecords: 2,
    },
  ]);
});

test("normalizeRecentEngagementRows returns dashboard-friendly engagement cards", () => {
  const rows = normalizeRecentEngagementRows([
    {
      domain: "feedback",
      source_id: "feedback-1",
      tenant_id: "tenant-1",
      label: "Amina Said",
      supporting_label: "Amazing safari",
      stage: "submitted",
      updated_at: "2026-04-29T14:00:00.000Z",
    },
  ]);

  assert.deepEqual(rows, [
    {
      domain: "feedback",
      sourceId: "feedback-1",
      tenantId: "tenant-1",
      label: "Amina Said",
      supportingLabel: "Amazing safari",
      stage: "submitted",
      updatedAt: "2026-04-29T14:00:00.000Z",
    },
  ]);
});
