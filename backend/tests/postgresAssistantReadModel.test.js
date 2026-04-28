import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeAssistantRecentRows,
  normalizeAssistantSummaryRows,
} from "../utils/postgresAssistantReadModel.js";

test("normalizeAssistantSummaryRows returns assistant-domain totals", () => {
  const rows = normalizeAssistantSummaryRows([
    {
      domain: "language-assistants",
      total_records: "2",
      active_records: "1",
    },
  ]);

  assert.deepEqual(rows, [
    {
      domain: "language-assistants",
      totalRecords: 2,
      activeRecords: 1,
    },
  ]);
});

test("normalizeAssistantRecentRows returns assistant feed items", () => {
  const rows = normalizeAssistantRecentRows([
    {
      domain: "travel-docs",
      source_id: "doc-1",
      tenant_id: "tenant-1",
      label: "USA",
      status: "active",
      supporting_label: "Visa",
      updated_at: "2026-04-28T19:00:00.000Z",
    },
  ]);

  assert.deepEqual(rows, [
    {
      domain: "travel-docs",
      sourceId: "doc-1",
      tenantId: "tenant-1",
      label: "USA",
      status: "active",
      supportingLabel: "Visa",
      updatedAt: "2026-04-28T19:00:00.000Z",
    },
  ]);
});
