import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTravelerInquiryDelete,
  buildTravelerInquiryLookup,
  buildTravelerInquiryUpsert,
  buildTravelerInquiryView,
} from "../utils/postgresTravelerInquiryRecords.js";

test("buildTravelerInquiryUpsert targets traveler_inquiry_records", () => {
  const statement = buildTravelerInquiryUpsert({
    _id: "inquiry-1",
    tenantId: "tenant-1",
    firstName: "Amina",
    lastName: "Said",
    destinations: ["Serengeti", "Ngorongoro"],
    leadStage: "qualified",
  });

  assert.equal(statement.text.includes("traveler_inquiry_records"), true);
  assert.equal(statement.values[0], "inquiry-1");
  assert.equal(statement.values[2], "Amina Said");
  assert.equal(statement.values[14], "qualified");
});

test("buildTravelerInquiryDelete targets traveler_inquiry_records", () => {
  const statement = buildTravelerInquiryDelete({
    sourceId: "inquiry-1",
    tenantId: "tenant-1",
  });

  assert.equal(statement.text.includes("traveler_inquiry_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["inquiry-1", "tenant-1"]);
});

test("buildTravelerInquiryLookup targets traveler_inquiry_records by source and tenant", () => {
  const statement = buildTravelerInquiryLookup({
    sourceId: "inquiry-1",
    tenantId: "tenant-1",
  });

  assert.equal(statement.text.includes("from public.traveler_inquiry_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["inquiry-1", "tenant-1"]);
});

test("buildTravelerInquiryView reconstructs the admin inquiry payload from postgres", () => {
  const inquiry = buildTravelerInquiryView({
    source_id: "inquiry-1",
    tenant_id: "tenant-1",
    traveler_name: "Amina Said",
    first_name: "Amina",
    last_name: "Said",
    email: "amina@example.com",
    phone: "+255700000000",
    destinations: ["Ngorongoro", "Serengeti"],
    travel_when: "June 2026",
    budget: "3500-5000",
    lead_stage: "qualified",
    status: "Pending",
    source_channel: "partner-referral",
    campaign_label: "April push",
    referral_code: "REF123",
    lead_score: 88,
    lead_temperature: "hot",
    source_payload: {
      message: "Looking for a family safari.",
      contactPreference: "email",
      followUpMessage: "We will send a quote soon.",
      automationSummary: "High-intent family lead",
    },
  });

  assert.equal(inquiry._id, "inquiry-1");
  assert.equal(inquiry.name, "Amina Said");
  assert.deepEqual(inquiry.destinations, ["Ngorongoro", "Serengeti"]);
  assert.equal(inquiry.leadScore, 88);
  assert.equal(inquiry.contactPreference, "email");
  assert.equal(inquiry.automationSummary, "High-intent family lead");
});
