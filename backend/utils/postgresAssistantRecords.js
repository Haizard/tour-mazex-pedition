import { createPostgresClient } from "./postgresClient.js";

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL assistant writer is not configured.");
  }

  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const deleteRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL assistant writer is not configured.");
  }

  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const querySingleRow = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL assistant writer is not configured.");
  }

  try {
    await client.connect();
    const result = await client.query(statement.text, statement.values);
    return result.rows[0] || null;
  } finally {
    await client.end().catch(() => {});
  }
};

const toIso = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const buildLanguageAssistantProfileRecord = (profile = {}) => ({
  sourceId: String(profile._id || ""),
  tenantId: String(profile.tenantId || ""),
  language: profile.language || "",
  localeCode: profile.localeCode || "",
  tone: profile.tone || "",
  useCases: Array.isArray(profile.useCases) ? profile.useCases : [],
  glossary: Array.isArray(profile.glossary) ? profile.glossary : [],
  status: profile.status || "draft",
  notes: profile.notes || "",
  sourcePayload: profile,
});

export const buildTravelDocumentationGuideRecord = (guide = {}) => ({
  sourceId: String(guide._id || ""),
  tenantId: String(guide.tenantId || ""),
  market: guide.market || "",
  topic: guide.topic || "",
  requirementSummary: guide.requirementSummary || "",
  sourceLabel: guide.sourceLabel || "",
  lastReviewedAt: guide.lastReviewedAt ? new Date(guide.lastReviewedAt).toISOString() : null,
  status: guide.status || "draft",
  notes: guide.notes || "",
  sourcePayload: guide,
});

export const buildLanguageAssistantProfileUpsert = (profile = {}) => {
  const record = buildLanguageAssistantProfileRecord(profile);

  return {
    text: `
      insert into public.language_assistant_profile_records (
        source_id, tenant_id, language, locale_code, tone, use_cases, glossary, status, notes, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        language = excluded.language,
        locale_code = excluded.locale_code,
        tone = excluded.tone,
        use_cases = excluded.use_cases,
        glossary = excluded.glossary,
        status = excluded.status,
        notes = excluded.notes,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.language,
      record.localeCode,
      record.tone,
      JSON.stringify(record.useCases || []),
      JSON.stringify(record.glossary || []),
      record.status,
      record.notes,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildTravelDocumentationGuideUpsert = (guide = {}) => {
  const record = buildTravelDocumentationGuideRecord(guide);

  return {
    text: `
      insert into public.travel_documentation_guide_records (
        source_id, tenant_id, market, topic, requirement_summary, source_label,
        last_reviewed_at, status, notes, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        market = excluded.market,
        topic = excluded.topic,
        requirement_summary = excluded.requirement_summary,
        source_label = excluded.source_label,
        last_reviewed_at = excluded.last_reviewed_at,
        status = excluded.status,
        notes = excluded.notes,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.market,
      record.topic,
      record.requirementSummary,
      record.sourceLabel,
      record.lastReviewedAt,
      record.status,
      record.notes,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildLanguageAssistantProfileDelete = (sourceId = "", tenantId = "") => ({
  text: `
    delete from public.language_assistant_profile_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildTravelDocumentationGuideDelete = (sourceId = "", tenantId = "") => ({
  text: `
    delete from public.travel_documentation_guide_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildLanguageAssistantProfileLookup = (sourceId = "", tenantId = "") => ({
  text: `
    select *
    from public.language_assistant_profile_records
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildTravelDocumentationGuideLookup = (sourceId = "", tenantId = "") => ({
  text: `
    select *
    from public.travel_documentation_guide_records
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildLanguageAssistantProfileView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  language: String(row.language || ""),
  localeCode: String(row.locale_code || ""),
  tone: String(row.tone || ""),
  useCases: Array.isArray(row.use_cases) ? row.use_cases : [],
  glossary: Array.isArray(row.glossary) ? row.glossary : [],
  status: String(row.status || "draft"),
  notes: String(row.notes || ""),
});

export const buildTravelDocumentationGuideView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  market: String(row.market || ""),
  topic: String(row.topic || ""),
  requirementSummary: String(row.requirement_summary || ""),
  sourceLabel: String(row.source_label || ""),
  lastReviewedAt: toIso(row.last_reviewed_at),
  status: String(row.status || "draft"),
  notes: String(row.notes || ""),
});

export const syncLanguageAssistantProfileRecord = (profile, env) =>
  upsertRecord(buildLanguageAssistantProfileUpsert(profile), env);

export const syncTravelDocumentationGuideRecord = (guide, env) =>
  upsertRecord(buildTravelDocumentationGuideUpsert(guide), env);

export const deleteLanguageAssistantProfileRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildLanguageAssistantProfileDelete(sourceId, tenantId), env);

export const deleteTravelDocumentationGuideRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildTravelDocumentationGuideDelete(sourceId, tenantId), env);

export const findLanguageAssistantProfileRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildLanguageAssistantProfileLookup(sourceId, tenantId), env);

export const findTravelDocumentationGuideRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildTravelDocumentationGuideLookup(sourceId, tenantId), env);
