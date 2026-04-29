import test from "node:test";
import assert from "node:assert/strict";

import {
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
