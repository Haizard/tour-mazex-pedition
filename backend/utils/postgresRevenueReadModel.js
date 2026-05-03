import { createPostgresClient } from "./postgresClient.js";

export const normalizeRevenueSummaryRows = (rows = []) =>
  rows.map((row = {}) => ({
    recordType: String(row.record_type || ""),
    totalRecords: Number(row.total_records || 0),
    totalValue: Number(row.total_value || 0),
    currency: String(row.currency || "USD"),
  }));

export const normalizeRecentRevenueRows = (rows = []) =>
  rows.map((row = {}) => ({
    recordType: String(row.record_type || ""),
    sourceId: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    label: String(row.label || ""),
    stage: String(row.stage || ""),
    amount: Number(row.amount || 0),
    currency: String(row.currency || "USD"),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }));

const buildSummaryQuery = (tenantId) => {
  const hasTenantFilter = Boolean(tenantId);

  return {
    text: `
      select
        record_type,
        sum(total_records)::int as total_records,
        sum(total_value)::numeric as total_value,
        max(currency) as currency
      from (
        select
          'bookings' as record_type,
          count(*) as total_records,
          coalesce(sum(total_price), 0) as total_value,
          'USD' as currency
        from public.booking_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'quotes' as record_type,
          count(*) as total_records,
          coalesce(sum(total_price), 0) as total_value,
          max(currency) as currency
        from public.quote_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'payments' as record_type,
          count(*) as total_records,
          coalesce(sum(amount), 0) as total_value,
          max(currency) as currency
        from public.payment_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}
      ) revenue_summary
      group by record_type
      order by record_type
    `,
    values: hasTenantFilter ? [tenantId] : [],
  };
};

const buildRecentRecordsQuery = (tenantId, limit = 12) => {
  const hasTenantFilter = Boolean(tenantId);
  const limitValue = Number(limit) > 0 ? Number(limit) : 12;
  const limitPlaceholder = hasTenantFilter ? "$2" : "$1";

  return {
    text: `
      select *
      from (
        select
          'bookings' as record_type,
          source_id,
          tenant_id,
          traveler_name as label,
          revenue_stage as stage,
          total_price as amount,
          currency,
          updated_at
        from public.booking_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'quotes' as record_type,
          source_id,
          tenant_id,
          coalesce(title, traveler_name, '') as label,
          conversion_stage as stage,
          total_price as amount,
          currency,
          updated_at
        from public.quote_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'payments' as record_type,
          source_id,
          tenant_id,
          customer_name as label,
          status as stage,
          amount,
          currency,
          updated_at
        from public.payment_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}
      ) recent_revenue_records
      order by updated_at desc
      limit ${limitPlaceholder}
    `,
    values: hasTenantFilter ? [tenantId, limitValue] : [limitValue],
  };
};

export const fetchRevenueRecordReadModel = async (
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

  await client.connect();

  try {
    const summaryQuery = buildSummaryQuery(tenantId);
    const recentQuery = buildRecentRecordsQuery(tenantId, limit);
    const [summaryResult, recentResult] = await Promise.all([
      client.query(summaryQuery.text, summaryQuery.values),
      client.query(recentQuery.text, recentQuery.values),
    ]);

    return {
      configured: true,
      summary: normalizeRevenueSummaryRows(summaryResult.rows),
      recentRecords: normalizeRecentRevenueRows(recentResult.rows),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
