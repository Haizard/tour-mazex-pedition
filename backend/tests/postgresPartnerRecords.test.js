import test from "node:test";
import assert from "node:assert/strict";

import { buildPartnerAccountUpsert } from "../utils/postgresPartnerRecords.js";

test("buildPartnerAccountUpsert targets partner_account_records", () => {
  const statement = buildPartnerAccountUpsert({
    _id: "partner-1",
    tenantId: "tenant-1",
    partnerType: "agency",
    companyName: "Safari Allies",
    status: "active",
  });

  assert.equal(statement.text.includes("partner_account_records"), true);
  assert.equal(statement.values[0], "partner-1");
  assert.equal(statement.values[3], "Safari Allies");
});
