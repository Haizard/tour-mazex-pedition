import test from "node:test";
import assert from "node:assert/strict";

import { buildTravelerInquiryUpsert } from "../utils/postgresTravelerInquiryRecords.js";

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
