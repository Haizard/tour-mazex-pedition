import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPartnerAccountLookup,
  buildPartnerAccountView,
  buildPartnerAccountDelete,
  buildPartnerAccountUpsert,
} from "../utils/postgresPartnerRecords.js";

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

test("buildPartnerAccountDelete targets partner_account_records", () => {
  const statement = buildPartnerAccountDelete("partner-1", "tenant-1");

  assert.equal(statement.text.includes("partner_account_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["partner-1", "tenant-1"]);
});

test("buildPartnerAccountLookup targets one partner account record", () => {
  const statement = buildPartnerAccountLookup("partner-1", "tenant-1");

  assert.equal(statement.text.includes("partner_account_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["partner-1", "tenant-1"]);
});

test("buildPartnerAccountView reconstructs the partner payload", () => {
  const partner = buildPartnerAccountView({
    source_id: "partner-1",
    tenant_id: "tenant-1",
    partner_type: "agency",
    company_name: "Safari Allies",
    contact_name: "Amina",
    email: "amina@example.com",
    phone: "+255700000000",
    location: "Arusha",
    service_focus: "Inbound agency",
    contract_label: "Preferred",
    payout_terms: "Net 14",
    notes: "Strong partner",
    status: "active",
  });

  assert.equal(partner._id, "partner-1");
  assert.equal(partner.companyName, "Safari Allies");
  assert.equal(partner.partnerType, "agency");
  assert.equal(partner.status, "active");
});
