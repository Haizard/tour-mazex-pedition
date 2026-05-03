import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeRecentRevenueRows,
  normalizeRevenueSummaryRows,
} from "../utils/postgresRevenueReadModel.js";

test("normalizeRevenueSummaryRows converts counts and totals to numbers", () => {
  const rows = normalizeRevenueSummaryRows([
    {
      record_type: "bookings",
      total_records: "4",
      total_value: "8200.50",
      currency: "USD",
    },
  ]);

  assert.deepEqual(rows, [
    {
      recordType: "bookings",
      totalRecords: 4,
      totalValue: 8200.5,
      currency: "USD",
    },
  ]);
});

test("normalizeRecentRevenueRows returns clean record cards", () => {
  const rows = normalizeRecentRevenueRows([
    {
      record_type: "payments",
      source_id: "payment-1",
      tenant_id: "tenant-1",
      label: "Traveler One",
      stage: "paid",
      amount: "450.75",
      currency: "USD",
      updated_at: "2026-04-28T10:00:00.000Z",
    },
  ]);

  assert.deepEqual(rows, [
    {
      recordType: "payments",
      sourceId: "payment-1",
      tenantId: "tenant-1",
      label: "Traveler One",
      stage: "paid",
      amount: 450.75,
      currency: "USD",
      updatedAt: "2026-04-28T10:00:00.000Z",
    },
  ]);
});
