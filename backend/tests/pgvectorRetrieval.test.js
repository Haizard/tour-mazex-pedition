import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSISTANT_KNOWLEDGE_VECTOR_DIMENSIONS,
  buildAssistantKnowledgeRecord,
  buildAssistantKnowledgeUpsert,
  buildDeterministicEmbedding,
  buildPgvectorLiteral,
  groupAssistantKnowledgeMatches,
} from "../utils/pgvectorRetrieval.js";

test("buildDeterministicEmbedding is stable and produces the expected dimensions", () => {
  const first = buildDeterministicEmbedding("French visa help for safari travelers");
  const second = buildDeterministicEmbedding("French visa help for safari travelers");

  assert.equal(first.length, ASSISTANT_KNOWLEDGE_VECTOR_DIMENSIONS);
  assert.deepEqual(first, second);
  assert.equal(first.some((value) => value !== 0), true);
});

test("buildPgvectorLiteral serializes embeddings for pgvector", () => {
  const literal = buildPgvectorLiteral([0.25, 0.5, -0.25]);

  assert.equal(literal, "[0.25,0.5,-0.25]");
});

test("buildAssistantKnowledgeRecord prepares vector-ready assistant knowledge", () => {
  const record = buildAssistantKnowledgeRecord({
    sourceType: "language-assistant-profile",
    sourceId: "profile-1",
    tenantId: "tenant-1",
    title: "French sales assistant",
    body: "Use warm French copy for safari sales replies.",
    metadata: { localeCode: "fr-FR" },
  });

  assert.equal(record.sourceType, "language-assistant-profile");
  assert.equal(record.embedding.length, ASSISTANT_KNOWLEDGE_VECTOR_DIMENSIONS);
  assert.equal(record.searchText.includes("French sales assistant"), true);
});

test("buildAssistantKnowledgeUpsert targets assistant knowledge embeddings", () => {
  const statement = buildAssistantKnowledgeUpsert(
    buildAssistantKnowledgeRecord({
      sourceType: "travel-documentation-guide",
      sourceId: "guide-1",
      tenantId: "tenant-1",
      title: "France visa guide",
      body: "French travelers should use the eVisa process.",
      metadata: { market: "France" },
    })
  );

  assert.equal(statement.text.includes("assistant_knowledge_embeddings"), true);
  assert.equal(statement.values[0], "travel-documentation-guide");
  assert.equal(statement.values[1], "guide-1");
  assert.equal(typeof statement.values[5], "string");
  assert.equal(statement.values[5].startsWith("["), true);
});

test("groupAssistantKnowledgeMatches groups rows by source type and keeps ranking order", () => {
  const grouped = groupAssistantKnowledgeMatches([
    { source_type: "language-assistant-profile", source_id: "profile-2" },
    { source_type: "travel-documentation-guide", source_id: "guide-1" },
    { source_type: "language-assistant-profile", source_id: "profile-1" },
    { source_type: "tour-package", source_id: "tour-2" },
    { source_type: "blog-post", source_id: "blog-1" },
    { source_type: "faq-entry", source_id: "faq-1" },
    { source_type: "campaign-entry", source_id: "campaign-1" },
    { source_type: "page-config", source_id: "page-1" },
    { source_type: "home-content-section", source_id: "home-1" },
  ]);

  assert.deepEqual(grouped.languageProfileIds, ["profile-2", "profile-1"]);
  assert.deepEqual(grouped.travelGuideIds, ["guide-1"]);
  assert.deepEqual(grouped.tourIds, ["tour-2"]);
  assert.deepEqual(grouped.blogIds, ["blog-1"]);
  assert.deepEqual(grouped.faqIds, ["faq-1"]);
  assert.deepEqual(grouped.campaignIds, ["campaign-1"]);
  assert.deepEqual(grouped.pageConfigIds, ["page-1"]);
  assert.deepEqual(grouped.homeContentIds, ["home-1"]);
});
