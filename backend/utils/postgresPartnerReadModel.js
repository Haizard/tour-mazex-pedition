import { createPostgresClient } from "./postgresClient.js";

export const normalizePartnerSummaryRows = (rows = []) =>
  rows.map((row = {}) => ({
    partnerType: String(row.partner_type || ""),
    totalRecords: Number(row.total_records || 0),
    activeRecords: Number(row.active_records || 0),
  }));

export const normalizePartnerRecentRows = (rows = []) =>
  rows.map((row = {}) => ({
    sourceId: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    companyName: String(row.company_name || ""),
    partnerType: String(row.partner_type || ""),
    status: String(row.status || ""),
    serviceFocus: String(row.service_focus || ""),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }));

export const fetchPartnerReadModel = async (
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
        partner_type,
        count(*)::int as total_records,
        count(*) filter (where status = 'active')::int as active_records
      from public.partner_account_records
      ${hasTenantFilter ? "where tenant_id = $1" : ""}
      group by partner_type
      order by total_records desc, partner_type asc
    `,
    values: hasTenantFilter ? [tenantId] : [],
  };
  const recentQuery = {
    text: `
      select
        source_id,
        tenant_id,
        company_name,
        partner_type,
        status,
        service_focus,
        updated_at
      from public.partner_account_records
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
      summary: normalizePartnerSummaryRows(summaryResult.rows),
      recentRecords: normalizePartnerRecentRows(recentResult.rows),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
