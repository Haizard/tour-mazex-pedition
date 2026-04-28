import {
  markBusinessTruthSyncCompleted,
  markBusinessTruthSyncPending,
} from "./businessTruthSync.js";
import { createPostgresClient, isPostgresConfigured } from "./postgresClient.js";
import { getRedisClient } from "./redisClient.js";

const SHADOW_QUEUE_KEY = "postgres_shadow_writes";

export const buildShadowEntitySnapshot = (entityType, record = {}) => ({
  entityType,
  sourceId: String(record._id || ""),
  tenantId: String(record.tenantId || ""),
  canonicalId: `${entityType}:${String(record._id || "")}`,
  payload: record,
  sourceCreatedAt: record.createdAt ? new Date(record.createdAt).toISOString() : null,
  sourceUpdatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : null,
});

export const buildShadowUpsertStatement = (snapshot = {}) => ({
  text: `
    insert into public.shadow_entity_snapshots (
      entity_type,
      source_id,
      tenant_id,
      canonical_id,
      payload,
      source_created_at,
      source_updated_at,
      shadow_synced_at
    ) values ($1, $2, $3, $4, $5::jsonb, $6::timestamptz, $7::timestamptz, now())
    on conflict (entity_type, source_id)
    do update set
      tenant_id = excluded.tenant_id,
      canonical_id = excluded.canonical_id,
      payload = excluded.payload,
      source_created_at = excluded.source_created_at,
      source_updated_at = excluded.source_updated_at,
      shadow_synced_at = now()
  `,
  values: [
    snapshot.entityType,
    snapshot.sourceId,
    snapshot.tenantId,
    snapshot.canonicalId,
    JSON.stringify(snapshot.payload || {}),
    snapshot.sourceCreatedAt,
    snapshot.sourceUpdatedAt,
  ],
});

export const enqueueShadowWrite = async (snapshot = {}, env = globalThis.process?.env || {}) => {
  const redisClient = await getRedisClient(env);

  if (!redisClient) {
    return false;
  }

  await redisClient.lPush(SHADOW_QUEUE_KEY, JSON.stringify(snapshot));
  return true;
};

const runShadowUpsert = async (snapshot = {}, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL shadow writer is not configured.");
  }

  try {
    await client.connect();
    const statement = buildShadowUpsertStatement(snapshot);
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

export const syncShadowEntity = async ({
  entityType,
  record,
  env = globalThis.process?.env || {},
  upsertShadow = runShadowUpsert,
  enqueue = enqueueShadowWrite,
} = {}) => {
  const snapshot = buildShadowEntitySnapshot(entityType, record);
  const attemptAt = new Date();
  const currentMetadata = record?.businessTruth || {};

  if (!snapshot.sourceId || !snapshot.tenantId) {
    return {
      ok: false,
      enqueued: false,
      reason: "missing-identifiers",
      businessTruthPatch: markBusinessTruthSyncPending(currentMetadata, {
        canonicalId: snapshot.canonicalId,
        lastShadowAttemptAt: attemptAt,
        lastShadowError: "Missing sourceId or tenantId for shadow sync.",
      }),
    };
  }

  if (!isPostgresConfigured(env)) {
    const enqueued = await enqueue(snapshot, env).catch(() => false);
    return {
      ok: false,
      enqueued,
      reason: "postgres-not-configured",
      businessTruthPatch: markBusinessTruthSyncPending(currentMetadata, {
        canonicalId: snapshot.canonicalId,
        lastShadowAttemptAt: attemptAt,
        lastShadowError: "PostgreSQL shadow writer is not configured.",
      }),
    };
  }

  try {
    await upsertShadow(snapshot, env);

    return {
      ok: true,
      enqueued: false,
      snapshot,
      businessTruthPatch: markBusinessTruthSyncCompleted(currentMetadata, {
        canonicalId: snapshot.canonicalId,
        migrationStatus: "shadowed",
        shadowWriteEnabled: true,
        lastShadowAttemptAt: attemptAt,
        lastShadowSyncAt: attemptAt,
        lastShadowError: "",
      }),
    };
  } catch (error) {
    const enqueued = await enqueue(snapshot, env).catch(() => false);

    return {
      ok: false,
      enqueued,
      snapshot,
      reason: "shadow-write-failed",
      errorMessage: error.message,
      businessTruthPatch: markBusinessTruthSyncPending(currentMetadata, {
        canonicalId: snapshot.canonicalId,
        lastShadowAttemptAt: attemptAt,
        lastShadowError: error.message,
      }),
    };
  }
};

export const syncMongoDocumentToShadowStore = async ({
  entityType,
  document,
  model,
  env = globalThis.process?.env || {},
} = {}) => {
  if (!document?._id || !model) {
    return {
      ok: false,
      enqueued: false,
      reason: "missing-document-or-model",
    };
  }

  const result = await syncShadowEntity({
    entityType,
    record: document,
    env,
  });

  if (result.businessTruthPatch) {
    await model.findByIdAndUpdate(document._id, {
      $set: {
        businessTruth: result.businessTruthPatch,
      },
    });
  }

  return result;
};
