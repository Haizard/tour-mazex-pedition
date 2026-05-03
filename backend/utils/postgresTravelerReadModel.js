import { createPostgresClient } from "./postgresClient.js";

export const normalizeTravelerSummaryRows = (rows = []) =>
  rows.map((row = {}) => ({
    leadStage: String(row.lead_stage || ""),
    totalRecords: Number(row.total_records || 0),
    averageLeadScore: Number(row.average_lead_score || 0),
  }));

export const normalizeRecentTravelerRows = (rows = []) =>
  rows.map((row = {}) => ({
    sourceId: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    travelerName: String(row.traveler_name || ""),
    destinations: Array.isArray(row.destinations) ? row.destinations : [],
    leadStage: String(row.lead_stage || ""),
    status: String(row.status || ""),
    sourceChannel: String(row.source_channel || ""),
    leadScore: Number(row.lead_score || 0),
    leadTemperature: String(row.lead_temperature || ""),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }));

export const fetchTravelerInquiryReadModel = async (
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
        lead_stage,
        count(*)::int as total_records,
        round(avg(lead_score)::numeric, 2) as average_lead_score
      from public.traveler_inquiry_records
      ${hasTenantFilter ? "where tenant_id = $1" : ""}
      group by lead_stage
      order by total_records desc, lead_stage asc
    `,
    values: hasTenantFilter ? [tenantId] : [],
  };
  const recentQuery = {
    text: `
      select
        source_id,
        tenant_id,
        traveler_name,
        coalesce(
          (
            select array_agg(value order by value)
            from jsonb_array_elements_text(destinations) value
          ),
          array[]::text[]
        ) as destinations,
        lead_stage,
        status,
        source_channel,
        lead_score,
        lead_temperature,
        updated_at
      from public.traveler_inquiry_records
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
      summary: normalizeTravelerSummaryRows(summaryResult.rows),
      recentRecords: normalizeRecentTravelerRows(recentResult.rows),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
