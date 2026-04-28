import { createPostgresClient } from "./postgresClient.js";

export const normalizeCompetitorSummaryRows = (rows = []) =>
  rows.map((row = {}) => ({
    status: String(row.status || ""),
    totalRecords: Number(row.total_records || 0),
    averagePriceUsd: Number(row.average_price_usd || 0),
  }));

export const normalizeCompetitorRecentRows = (rows = []) =>
  rows.map((row = {}) => ({
    sourceId: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    competitorName: String(row.competitor_name || ""),
    status: String(row.status || ""),
    focusRoute: String(row.focus_route || ""),
    observedPriceUsd:
      row.observed_price_usd === null || row.observed_price_usd === undefined
        ? 0
        : Number(row.observed_price_usd || 0),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }));

export const fetchCompetitorReadModel = async (
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
        status,
        count(*)::int as total_records,
        round(avg(observed_price_usd)::numeric, 2) as average_price_usd
      from public.competitor_insight_records
      ${hasTenantFilter ? "where tenant_id = $1" : ""}
      group by status
      order by total_records desc, status asc
    `,
    values: hasTenantFilter ? [tenantId] : [],
  };
  const recentQuery = {
    text: `
      select
        source_id,
        tenant_id,
        competitor_name,
        status,
        focus_route,
        observed_price_usd,
        updated_at
      from public.competitor_insight_records
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
      summary: normalizeCompetitorSummaryRows(summaryResult.rows),
      recentRecords: normalizeCompetitorRecentRows(recentResult.rows),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
