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

export const syncMediaAssetRecord = (media, env) =>
  upsertRecord(buildMediaAssetUpsert(media), env);
