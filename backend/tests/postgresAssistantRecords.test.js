import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLanguageAssistantProfileDelete,
  buildLanguageAssistantProfileUpsert,
  buildTravelDocumentationGuideDelete,
  buildTravelDocumentationGuideUpsert,
} from "../utils/postgresAssistantRecords.js";

test("buildLanguageAssistantProfileUpsert targets language_assistant_profile_records", () => {
  const statement = buildLanguageAssistantProfileUpsert({
    _id: "lang-1",
    tenantId: "tenant-1",
    language: "French",
    status: "active",
  });

  assert.equal(statement.text.includes("language_assistant_profile_records"), true);
  assert.equal(statement.values[0], "lang-1");
  assert.equal(statement.values[2], "French");
});

test("buildTravelDocumentationGuideUpsert targets travel_documentation_guide_records", () => {
  const statement = buildTravelDocumentationGuideUpsert({
    _id: "doc-1",
    tenantId: "tenant-1",
    market: "USA",
    topic: "Visa",
  });

  assert.equal(statement.text.includes("travel_documentation_guide_records"), true);
  assert.equal(statement.values[0], "doc-1");
  assert.equal(statement.values[2], "USA");
  assert.equal(statement.values[3], "Visa");
});

test("buildLanguageAssistantProfileDelete targets language_assistant_profile_records", () => {
  const statement = buildLanguageAssistantProfileDelete("lang-1", "tenant-1");

  assert.equal(statement.text.includes("language_assistant_profile_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["lang-1", "tenant-1"]);
});

test("buildTravelDocumentationGuideDelete targets travel_documentation_guide_records", () => {
  const statement = buildTravelDocumentationGuideDelete("doc-1", "tenant-1");

  assert.equal(statement.text.includes("travel_documentation_guide_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["doc-1", "tenant-1"]);
});
