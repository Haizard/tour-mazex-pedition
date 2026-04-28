import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeMediaRecentRows,
  normalizeMediaSummaryRows,
} from "../utils/postgresMediaReadModel.js";

test("normalizeMediaSummaryRows returns provider totals", () => {
  const rows = normalizeMediaSummaryRows([
    {
      storage_provider: "mongo-inline",
      total_records: "2",
      total_bytes: "8192",
    },
  ]);

  assert.deepEqual(rows, [
    {
      storageProvider: "mongo-inline",
      totalRecords: 2,
      totalBytes: 8192,
    },
  ]);
});

test("normalizeMediaRecentRows returns media feed items", () => {
  const rows = normalizeMediaRecentRows([
    {
      source_id: "media-1",
      tenant_id: "tenant-1",
      filename: "hero.jpg",
      storage_provider: "mongo-inline",
      content_type: "image/jpeg",
      size: "4096",
      updated_at: "2026-04-28T17:00:00.000Z",
    },
  ]);

  assert.deepEqual(rows, [
    {
      sourceId: "media-1",
      tenantId: "tenant-1",
      filename: "hero.jpg",
      storageProvider: "mongo-inline",
      contentType: "image/jpeg",
      size: 4096,
      updatedAt: "2026-04-28T17:00:00.000Z",
    },
  ]);
});
