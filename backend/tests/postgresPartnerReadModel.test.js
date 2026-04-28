import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizePartnerRecentRows,
  normalizePartnerSummaryRows,
} from "../utils/postgresPartnerReadModel.js";

test("normalizePartnerSummaryRows returns partner counts", () => {
  const rows = normalizePartnerSummaryRows([
    {
      partner_type: "agency",
      total_records: "3",
      active_records: "2",
    },
  ]);

  assert.deepEqual(rows, [
    {
      partnerType: "agency",
      totalRecords: 3,
      activeRecords: 2,
    },
  ]);
});

test("normalizePartnerRecentRows returns partner feed items", () => {
  const rows = normalizePartnerRecentRows([
    {
      source_id: "partner-1",
      tenant_id: "tenant-1",
      company_name: "Safari Allies",
      partner_type: "agency",
      status: "active",
      service_focus: "B2B referrals",
      updated_at: "2026-04-28T16:00:00.000Z",
    },
  ]);

  assert.deepEqual(rows, [
    {
      sourceId: "partner-1",
      tenantId: "tenant-1",
      companyName: "Safari Allies",
      partnerType: "agency",
      status: "active",
      serviceFocus: "B2B referrals",
      updatedAt: "2026-04-28T16:00:00.000Z",
    },
  ]);
});
