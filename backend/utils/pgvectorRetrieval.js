import { createPostgresClient } from "./postgresClient.js";

export const ASSISTANT_KNOWLEDGE_VECTOR_DIMENSIONS = 64;

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value = "") =>
  normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const hashToken = (token = "") => {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
};

export const buildDeterministicEmbedding = (
  text = "",
  dimensions = ASSISTANT_KNOWLEDGE_VECTOR_DIMENSIONS
) => {
  const embedding = Array.from({ length: dimensions }, () => 0);
  const tokens = tokenize(text);

  if (!tokens.length) {
    return embedding;
  }

  for (const token of tokens) {
    const hash = hashToken(token);
    const bucket = hash % dimensions;
    const sign = hash % 2 === 0 ? 1 : -1;
    const tokenWeight = Math.max(1, Math.min(token.length, 12)) / 12;
    embedding[bucket] += sign * tokenWeight;
  }

  const norm = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0));
  if (!norm) {
    return embedding;
  }

  return embedding.map((value) => Number((value / norm).toFixed(6)));
};

export const buildPgvectorLiteral = (embedding = []) =>
  `[${(embedding || []).map((value) => Number(value || 0)).join(",")}]`;

export const buildAssistantKnowledgeRecord = ({
  sourceType = "",
  sourceId = "",
  tenantId = "",
  title = "",
  body = "",
  metadata = {},
} = {}) => {
  const searchText = [title, body, JSON.stringify(metadata || {})].filter(Boolean).join(" ");

  return {
    sourceType: String(sourceType || ""),
    sourceId: String(sourceId || ""),
    tenantId: String(tenantId || ""),
    title: String(title || ""),
    body: String(body || ""),
    searchText,
    metadata: metadata || {},
    embedding: buildDeterministicEmbedding(searchText),
  };
};

export const buildAssistantKnowledgeUpsert = (record = {}) => ({
  text: `
    insert into public.assistant_knowledge_embeddings (
      source_type,
      source_id,
      tenant_id,
      title,
      body,
      embedding,
      metadata
    ) values (
      $1, $2, $3, $4, $5, $6::vector, $7::jsonb
    )
    on conflict (source_type, source_id)
    do update set
      tenant_id = excluded.tenant_id,
      title = excluded.title,
      body = excluded.body,
      embedding = excluded.embedding,
      metadata = excluded.metadata,
      updated_at = now()
  `,
  values: [
    record.sourceType,
    record.sourceId,
    record.tenantId,
    record.title,
    record.body,
    buildPgvectorLiteral(record.embedding),
    JSON.stringify(record.metadata || {}),
  ],
});

export const buildAssistantKnowledgeDelete = ({
  sourceType = "",
  sourceId = "",
} = {}) => ({
  text: `
    delete from public.assistant_knowledge_embeddings
    where source_type = $1 and source_id = $2
  `,
  values: [String(sourceType || ""), String(sourceId || "")],
});

export const buildAssistantKnowledgeSearch = ({
  tenantId = "",
  query = "",
  sourceTypes = [],
  limit = 6,
} = {}) => {
  const normalizedSourceTypes = (sourceTypes || []).filter(Boolean);
  const embeddingLiteral = buildPgvectorLiteral(buildDeterministicEmbedding(query));

  return {
    text: `
      select
        source_type,
        source_id,
        title,
        body,
        metadata,
        embedding <=> $2::vector as distance
      from public.assistant_knowledge_embeddings
      where tenant_id = $1
        and (
          cardinality($3::text[]) = 0
          or source_type = any($3::text[])
        )
      order by embedding <=> $2::vector asc
      limit $4
    `,
    values: [String(tenantId || ""), embeddingLiteral, normalizedSourceTypes, Number(limit || 6)],
  };
};

export const groupAssistantKnowledgeMatches = (rows = []) =>
  rows.reduce(
    (grouped, row = {}) => {
      const sourceType = String(row.source_type || "");
      const sourceId = String(row.source_id || "");

      if (!sourceId) {
        return grouped;
      }

      if (sourceType === "language-assistant-profile") {
        grouped.languageProfileIds.push(sourceId);
      }

      if (sourceType === "travel-documentation-guide") {
        grouped.travelGuideIds.push(sourceId);
      }

      if (sourceType === "tour-package") {
        grouped.tourIds.push(sourceId);
      }

      if (sourceType === "blog-post") {
        grouped.blogIds.push(sourceId);
      }

      if (sourceType === "faq-entry") {
        grouped.faqIds.push(sourceId);
      }

      if (sourceType === "campaign-entry") {
        grouped.campaignIds.push(sourceId);
      }

      if (sourceType === "page-config") {
        grouped.pageConfigIds.push(sourceId);
      }

      if (sourceType === "home-content-section") {
        grouped.homeContentIds.push(sourceId);
      }

      return grouped;
    },
    {
      languageProfileIds: [],
      travelGuideIds: [],
      tourIds: [],
      blogIds: [],
      faqIds: [],
      campaignIds: [],
      pageConfigIds: [],
      homeContentIds: [],
    }
  );

const executeStatement = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) {
    return null;
  }

  try {
    await client.connect();
    return await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

export const syncAssistantKnowledgeEmbedding = async (record = {}, env = globalThis.process?.env || {}) => {
  const statement = buildAssistantKnowledgeUpsert(record);
  await executeStatement(statement, env);
};

export const deleteAssistantKnowledgeEmbedding = async ({
  sourceType,
  sourceId,
} = {}, env = globalThis.process?.env || {}) => {
  const statement = buildAssistantKnowledgeDelete({ sourceType, sourceId });
  await executeStatement(statement, env);
};

export const searchAssistantKnowledge = async ({
  tenantId = "",
  query = "",
  sourceTypes = [],
  limit = 6,
  env = globalThis.process?.env || {},
} = {}) => {
  const trimmedQuery = String(query || "").trim();
  if (!tenantId || !trimmedQuery) {
    return {
      languageProfileIds: [],
      travelGuideIds: [],
      tourIds: [],
      blogIds: [],
      faqIds: [],
      campaignIds: [],
      pageConfigIds: [],
      homeContentIds: [],
    };
  }

  const statement = buildAssistantKnowledgeSearch({
    tenantId,
    query: trimmedQuery,
    sourceTypes,
    limit,
  });

  try {
    const result = await executeStatement(statement, env);
    return groupAssistantKnowledgeMatches(result?.rows || []);
  } catch (error) {
    console.error("Assistant knowledge search failed:", error.message);
    return {
      languageProfileIds: [],
      travelGuideIds: [],
      tourIds: [],
      blogIds: [],
      faqIds: [],
      campaignIds: [],
      pageConfigIds: [],
      homeContentIds: [],
    };
  }
};
