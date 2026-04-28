import { createPostgresClient } from "./postgresClient.js";

export const normalizeAssistantSummaryRows = (rows = []) =>
  rows.map((row = {}) => ({
    domain: String(row.domain || ""),
    totalRecords: Number(row.total_records || 0),
    activeRecords: Number(row.active_records || 0),
  }));

export const normalizeAssistantRecentRows = (rows = []) =>
  rows.map((row = {}) => ({
    domain: String(row.domain || ""),
    sourceId: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    label: String(row.label || ""),
    status: String(row.status || ""),
    supportingLabel: String(row.supporting_label || ""),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }));

export const fetchAssistantReadModel = async (
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
        domain,
        sum(total_records)::int as total_records,
        sum(active_records)::int as active_records
      from (
        select
          'language-assistants' as domain,
          count(*) as total_records,
          count(*) filter (where status = 'active') as active_records
        from public.language_assistant_profile_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'travel-docs' as domain,
          count(*) as total_records,
          count(*) filter (where status = 'active') as active_records
        from public.travel_documentation_guide_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}
      ) assistant_summary
      group by domain
      order by domain
    `,
    values: hasTenantFilter ? [tenantId] : [],
  };
  const recentQuery = {
    text: `
      select *
      from (
        select
          'language-assistants' as domain,
          source_id,
          tenant_id,
          language as label,
          status,
          coalesce(locale_code, tone, '') as supporting_label,
          updated_at
        from public.language_assistant_profile_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'travel-docs' as domain,
          source_id,
          tenant_id,
          market as label,
          status,
          coalesce(topic, source_label, '') as supporting_label,
          updated_at
        from public.travel_documentation_guide_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}
      ) recent_assistant_records
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
      summary: normalizeAssistantSummaryRows(summaryResult.rows),
      recentRecords: normalizeAssistantRecentRows(recentResult.rows),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
