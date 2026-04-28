import { createPostgresClient } from "./postgresClient.js";

export const normalizeOperationsSummaryRows = (rows = []) =>
  rows.map((row = {}) => ({
    recordType: String(row.record_type || ""),
    totalRecords: Number(row.total_records || 0),
    activeRecords: Number(row.active_records || 0),
  }));

export const normalizeOperationsRecentRows = (rows = []) =>
  rows.map((row = {}) => ({
    recordType: String(row.record_type || ""),
    sourceId: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    label: String(row.label || ""),
    stage: String(row.stage || ""),
    supportingLabel: String(row.supporting_label || ""),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }));

export const fetchOperationsReadModel = async (
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
        record_type,
        sum(total_records)::int as total_records,
        sum(active_records)::int as active_records
      from (
        select
          'guides' as record_type,
          count(*) as total_records,
          count(*) filter (where availability_status = 'assigned') as active_records
        from public.guide_driver_assignment_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'accommodations' as record_type,
          count(*) as total_records,
          count(*) filter (where status = 'confirmed') as active_records
        from public.accommodation_reservation_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'airport-pickups' as record_type,
          count(*) as total_records,
          count(*) filter (where status = 'scheduled') as active_records
        from public.airport_pickup_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}
      ) operations_summary
      group by record_type
      order by record_type
    `,
    values: hasTenantFilter ? [tenantId] : [],
  };

  const limitValue = Number(limit) > 0 ? Number(limit) : 12;
  const recentQuery = {
    text: `
      select *
      from (
        select
          'guides' as record_type,
          source_id,
          tenant_id,
          full_name as label,
          availability_status as stage,
          coalesce(assigned_tour_title, staff_type, '') as supporting_label,
          updated_at
        from public.guide_driver_assignment_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'accommodations' as record_type,
          source_id,
          tenant_id,
          hotel_name as label,
          status as stage,
          coalesce(destination, booking_guest_name, '') as supporting_label,
          updated_at
        from public.accommodation_reservation_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}

        union all

        select
          'airport-pickups' as record_type,
          source_id,
          tenant_id,
          guest_name as label,
          status as stage,
          coalesce(airport_code, destination_label, '') as supporting_label,
          updated_at
        from public.airport_pickup_records
        ${hasTenantFilter ? "where tenant_id = $1" : ""}
      ) recent_operations_records
      order by updated_at desc
      limit ${hasTenantFilter ? "$2" : "$1"}
    `,
    values: hasTenantFilter ? [tenantId, limitValue] : [limitValue],
  };

  await client.connect();

  try {
    const [summaryResult, recentResult] = await Promise.all([
      client.query(summaryQuery.text, summaryQuery.values),
      client.query(recentQuery.text, recentQuery.values),
    ]);

    return {
      configured: true,
      summary: normalizeOperationsSummaryRows(summaryResult.rows),
      recentRecords: normalizeOperationsRecentRows(recentResult.rows),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
