import test from "node:test";
import assert from "node:assert/strict";

import { buildEcosystemIntelligenceReport } from "../utils/ecosystemIntelligence.js";

test("buildEcosystemIntelligenceReport aggregates funnel, revenue, partners, and network health", async () => {
  const queries = [];
  const fakeClient = {
    async connect() {},
    async query(sql, values) {
      queries.push({ sql, values });

      if (sql.includes("traveler_inquiry_records")) {
        return {
          rows: [
            {
              total_inquiries: "20",
              qualified_leads: "12",
              converted_leads: "5",
            },
          ],
        };
      }

      if (sql.includes("from public.booking_records") && sql.includes("group by lead_source")) {
        return {
          rows: [
            {
              source_channel: "website",
              booking_count: "3",
              gross_revenue: "9000",
              average_booking_value: "3000",
            },
            {
              source_channel: "partner-referral",
              booking_count: "2",
              gross_revenue: "6000",
              average_booking_value: "3000",
            },
          ],
        };
      }

      if (sql.includes("case when referral_code = ''")) {
        return {
          rows: [
            {
              company_name: "Direct",
              referral_code: "",
              booking_count: "3",
              total_attributed_revenue: "9000",
            },
            {
              company_name: "AFF-77",
              referral_code: "AFF-77",
              booking_count: "2",
              total_attributed_revenue: "6000",
            },
          ],
        };
      }

      if (sql.includes("marketplace_partnership_records")) {
        return {
          rows: [
            {
              total_partnerships: "4",
              active_partnerships: "3",
              average_commission: "14.5",
            },
          ],
        };
      }

      throw new Error(`Unexpected query: ${sql}`);
    },
    async end() {},
  };

  const report = await buildEcosystemIntelligenceReport("tenant_1", {}, { client: fakeClient });

  assert.equal(queries.length, 4);
  assert.equal(report.funnel.totalInquiries, 20);
  assert.equal(report.funnel.qualifiedLeads, 12);
  assert.equal(report.funnel.convertedLeads, 5);
  assert.equal(report.funnel.conversionRate, "25.0%");

  assert.equal(report.revenue.totalGross, 15000);
  assert.equal(report.revenue.channelBreakdown.length, 2);
  assert.equal(report.revenue.channelBreakdown[0].channel, "website");
  assert.equal(report.revenue.channelBreakdown[0].marketShare, "60.0%");

  assert.equal(report.partners.length, 2);
  assert.equal(report.partners[1].code, "AFF-77");
  assert.equal(report.network.totalPartnerships, 4);
  assert.equal(report.network.activePartnerships, 3);
  assert.equal(report.network.averageCommission, "14.5%");
  assert.ok(report.timestamp);
});

test("buildEcosystemIntelligenceReport falls back when partnership table is missing", async () => {
  const fakeClient = {
    async connect() {},
    async query(sql) {
      if (sql.includes("traveler_inquiry_records")) {
        return {
          rows: [{ total_inquiries: "0", qualified_leads: "0", converted_leads: "0" }],
        };
      }

      if (sql.includes("from public.booking_records")) {
        return { rows: [] };
      }

      if (sql.includes("marketplace_partnership_records")) {
        const error = new Error('relation "public.marketplace_partnership_records" does not exist');
        error.code = "42P01";
        throw error;
      }

      return { rows: [] };
    },
    async end() {},
  };

  const report = await buildEcosystemIntelligenceReport("tenant_1", {}, { client: fakeClient });

  assert.equal(report.network.totalPartnerships, 0);
  assert.equal(report.network.activePartnerships, 0);
  assert.equal(report.network.averageCommission, "0.0%");
  assert.equal(report.network.degraded, true);
});
