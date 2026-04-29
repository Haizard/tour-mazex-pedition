import { createPostgresClient } from "./postgresClient.js";

export const normalizeEngagementSummaryRows = (rows = []) =>
  rows.map((row = {}) => ({
    domain: String(row.domain || ""),
    totalRecords: Number(row.total_records || 0),
    activeRecords: Number(row.submitted_records || 0),
  }));

export const normalizeRecentEngagementRows = (rows = []) =>
  rows.map((row = {}) => ({
    domain: String(row.domain || ""),
    sourceId: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    label: String(row.label || ""),
    supportingLabel: String(row.supporting_label || ""),
    stage: String(row.stage || ""),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }));

export const fetchEngagementReadModel = async (
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
        sum(submitted_records)::int as submitted_records
      from (
        select
          'feedback' as domain,
          count(*) as total_records,
          count(*) filter (where status = 'submitted') as submitted_records
        from public.traveler_feedback_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'follow-ups' as domain,
          count(*) as total_records,
          count(*) filter (where status in ('active', 'completed')) as submitted_records
        from public.lead_follow_up_sequence_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}
      ) engagement_summary
      group by domain
      order by domain asc
    `,
    values: hasTenantFilter ? [tenantId] : [],
  };

  const recentQuery = {
    text: `
      select *
      from (
        select
          'feedback' as domain,
          source_id,
          tenant_id,
          coalesce((source_payload->>'guestName'), '') as label,
          public_review as supporting_label,
          status as stage,
          updated_at
        from public.traveler_feedback_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'follow-ups' as domain,
          source_id,
          tenant_id,
          coalesce((source_payload->>'status'), '') as label,
          coalesce(inquiry_id, booking_id, '') as supporting_label,
          status as stage,
          updated_at
        from public.lead_follow_up_sequence_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}
      ) recent_engagement_records
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
      summary: normalizeEngagementSummaryRows(summaryResult.rows),
      recentRecords: normalizeRecentEngagementRows(recentResult.rows),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
