import { createPostgresClient } from "./postgresClient.js";

export const normalizeMediaSummaryRows = (rows = []) =>
  rows.map((row = {}) => ({
    storageProvider: String(row.storage_provider || ""),
    totalRecords: Number(row.total_records || 0),
    totalBytes: Number(row.total_bytes || 0),
  }));

export const normalizeMediaRecentRows = (rows = []) =>
  rows.map((row = {}) => ({
    sourceId: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    filename: String(row.filename || ""),
    storageProvider: String(row.storage_provider || ""),
    contentType: String(row.content_type || "application/octet-stream"),
    size: Number(row.size || 0),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }));

export const fetchMediaReadModel = async (
  { tenantId = "", limit = 12 } = {},
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);

  if (!client) {
    return {
      configured: false,
      summary: [],
      recentRecords: [],
    };
  }

  const hasTenantFilter = Boolean(tenantId);
  const summaryQuery = {
    text: `
      select
        storage_provider,
        count(*)::int as total_records,
        coalesce(sum(size), 0)::bigint as total_bytes
      from public.media_asset_records
      ${hasTenantFilter ? "where tenant_id = $1" : ""}
      group by storage_provider
      order by total_records desc, storage_provider asc
    `,
    values: hasTenantFilter ? [tenantId] : [],
  };
  const recentQuery = {
    text: `
      select
        source_id,
        tenant_id,
        filename,
        storage_provider,
        content_type,
        size,
        updated_at
      from public.media_asset_records
      ${hasTenantFilter ? "where tenant_id = $1" : ""}
      order by updated_at desc
      limit ${hasTenantFilter ? "$2" : "$1"}
    `,
    values: hasTenantFilter ? [tenantId, Number(limit) || 12] : [Number(limit) || 12],
  };

  await client.connect();

  try {
    const [summaryResult, recentResult] = await Promise.all([
      client.query(summaryQuery.text, summaryQuery.values),
      client.query(recentQuery.text, recentQuery.values),
    ]);

    return {
      configured: true,
      summary: normalizeMediaSummaryRows(summaryResult.rows),
      recentRecords: normalizeMediaRecentRows(recentResult.rows),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
