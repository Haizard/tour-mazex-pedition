import { createPostgresClient } from "./postgresClient.js";

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL media writer is not configured.");
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
    throw new Error("PostgreSQL media writer is not configured.");
  }

  try {
    await client.connect();
    const result = await client.query(statement.text, statement.values);
    return result.rows[0] || null;
  } finally {
    await client.end().catch(() => {});
  }
};

export const buildMediaAssetRecord = (media = {}) => ({
  sourceId: String(media._id || ""),
  tenantId: String(media.tenantId || ""),
  filename: media.filename || "",
  contentType: media.contentType || "application/octet-stream",
  size: Number(media.size || 0),
  storageProvider: media.storageProvider || "mongo-inline",
  storageKey: media.storageKey || "",
  storageBucket: media.storageBucket || "",
  storageEndpoint: media.storageEndpoint || "",
  publicUrl: media.publicUrl || "",
  uploadedBy: media.uploadedBy ? String(media.uploadedBy) : "",
  sourcePayload: media,
});

export const buildMediaAssetUpsert = (media = {}) => {
  const record = buildMediaAssetRecord(media);

  return {
    text: `
      insert into public.media_asset_records (
        source_id, tenant_id, filename, content_type, size, storage_provider, storage_key,
        storage_bucket, storage_endpoint, public_url, uploaded_by, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        filename = excluded.filename,
        content_type = excluded.content_type,
        size = excluded.size,
        storage_provider = excluded.storage_provider,
        storage_key = excluded.storage_key,
        storage_bucket = excluded.storage_bucket,
        storage_endpoint = excluded.storage_endpoint,
        public_url = excluded.public_url,
        uploaded_by = excluded.uploaded_by,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.filename,
      record.contentType,
      record.size,
      record.storageProvider,
      record.storageKey,
      record.storageBucket,
      record.storageEndpoint,
      record.publicUrl,
      record.uploadedBy || null,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildMediaAssetLookup = (sourceId = "", tenantId = "") => ({
  text: `
    select *
    from public.media_asset_records
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildMediaAssetView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  filename: String(row.filename || ""),
  contentType: String(row.content_type || "application/octet-stream"),
  size: Number(row.size || 0),
  storageProvider: String(row.storage_provider || "mongo-inline"),
  storageKey: String(row.storage_key || ""),
  storageBucket: String(row.storage_bucket || ""),
  storageEndpoint: String(row.storage_endpoint || ""),
  publicUrl: String(row.public_url || ""),
  uploadedBy: row.uploaded_by ? String(row.uploaded_by) : "",
});

export const syncMediaAssetRecord = (media, env) =>
  upsertRecord(buildMediaAssetUpsert(media), env);

export const findMediaAssetRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildMediaAssetLookup(sourceId, tenantId), env);
