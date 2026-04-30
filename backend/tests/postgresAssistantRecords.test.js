import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLanguageAssistantProfileLookup,
  buildLanguageAssistantProfileView,
  buildLanguageAssistantProfileDelete,
  buildLanguageAssistantProfileUpsert,
  buildTravelDocumentationGuideLookup,
  buildTravelDocumentationGuideView,
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

test("buildLanguageAssistantProfileLookup targets one language assistant record", () => {
  const statement = buildLanguageAssistantProfileLookup("lang-1", "tenant-1");

  assert.equal(statement.text.includes("language_assistant_profile_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["lang-1", "tenant-1"]);
});

test("buildLanguageAssistantProfileView reconstructs the assistant payload", () => {
  const profile = buildLanguageAssistantProfileView({
    source_id: "lang-1",
    tenant_id: "tenant-1",
    language: "French",
    locale_code: "fr-FR",
    tone: "warm",
    use_cases: ["sales"],
    glossary: ["safari"],
    status: "active",
    notes: "Ready",
  });

  assert.equal(profile._id, "lang-1");
  assert.equal(profile.language, "French");
  assert.equal(profile.localeCode, "fr-FR");
  assert.equal(profile.status, "active");
});

test("buildTravelDocumentationGuideDelete targets travel_documentation_guide_records", () => {
  const statement = buildTravelDocumentationGuideDelete("doc-1", "tenant-1");

  assert.equal(statement.text.includes("travel_documentation_guide_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["doc-1", "tenant-1"]);
});

test("buildTravelDocumentationGuideLookup targets one documentation guide", () => {
  const statement = buildTravelDocumentationGuideLookup("doc-1", "tenant-1");

  assert.equal(statement.text.includes("travel_documentation_guide_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["doc-1", "tenant-1"]);
});

test("buildTravelDocumentationGuideView reconstructs the documentation payload", () => {
  const guide = buildTravelDocumentationGuideView({
    source_id: "doc-1",
    tenant_id: "tenant-1",
    market: "USA",
    topic: "Visa",
    requirement_summary: "Visa required",
    source_label: "Embassy",
    last_reviewed_at: "2026-05-01T00:00:00.000Z",
    status: "active",
    notes: "Current",
  });

  assert.equal(guide._id, "doc-1");
  assert.equal(guide.market, "USA");
  assert.equal(guide.topic, "Visa");
  assert.equal(guide.status, "active");
});
