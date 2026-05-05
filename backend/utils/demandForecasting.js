/**
 * Demand Forecasting Engine
 *
 * Uses PostgreSQL booking lifecycle data to identify demand patterns,
 * fill rate trends, and seasonal velocity signals.
 * Output feeds into dynamic pricing and the Intelligence dashboard.
 */
import { createPostgresClient } from "./postgresClient.js";

/**
 * Builds a demand forecast report for a given tenant.
 * Returns monthly booking velocity, fill rates, and peak period prediction.
 */
export const buildDemandForecastReport = async (tenantId, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL client not configured for demand forecasting.");

  try {
    await client.connect();

    // 1. Monthly booking velocity (last 12 months)
    const velocityResult = await client.query(`
      select
        to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
        count(*) as total_bookings,
        count(case when revenue_stage = 'paid' then 1 end) as paid_bookings,
        coalesce(sum(case when revenue_stage = 'paid' then total_price end), 0) as revenue
      from public.booking_records
      where tenant_id = $1
        and created_at >= now() - interval '12 months'
        and revenue_stage != 'cancelled'
      group by date_trunc('month', created_at)
      order by month asc
    `, [tenantId]);

    // 2. Day-of-week booking concentration (identifies peak days)
    const dowResult = await client.query(`
      select
        to_char(created_at, 'Day') as day_of_week,
        extract(dow from created_at)::int as dow_index,
        count(*) as booking_count
      from public.booking_records
      where tenant_id = $1
        and created_at >= now() - interval '90 days'
        and revenue_stage != 'cancelled'
      group by to_char(created_at, 'Day'), extract(dow from created_at)
      order by dow_index
    `, [tenantId]);

    // 3. Lead time analysis (days between inquiry and booking)
    const leadTimeResult = await client.query(`
      select
        round(avg(
          extract(epoch from (b.created_at - t.created_at)) / 86400
        )::numeric, 1) as avg_days_to_book,
        min(
          extract(epoch from (b.created_at - t.created_at)) / 86400
        )::int as min_days,
        max(
          extract(epoch from (b.created_at - t.created_at)) / 86400
        )::int as max_days
      from public.booking_records b
      join public.traveler_inquiry_records t
        on t.source_id = b.source_id and t.tenant_id = b.tenant_id
      where b.tenant_id = $1
        and b.revenue_stage = 'paid'
        and b.created_at >= now() - interval '6 months'
    `, [tenantId]);

    // 4. Current period fill rate (this month vs last month)
    const fillRateResult = await client.query(`
      select
        count(case when date_trunc('month', created_at) = date_trunc('month', now()) then 1 end) as current_month,
        count(case when date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month') then 1 end) as last_month
      from public.booking_records
      where tenant_id = $1 and revenue_stage != 'cancelled'
    `, [tenantId]);

    const velocity = velocityResult.rows || [];
    const dowPattern = dowResult.rows || [];
    const leadTime = leadTimeResult.rows[0] || {};
    const fillRate = fillRateResult.rows[0] || {};

    // Compute trend direction
    const recentMonths = velocity.slice(-3);
    const trend = recentMonths.length >= 2
      ? Number(recentMonths[recentMonths.length - 1]?.total_bookings || 0) >= Number(recentMonths[0]?.total_bookings || 0)
        ? "growing"
        : "declining"
      : "stable";

    // Peak day prediction
    const peakDay = dowPattern.sort((a, b) => Number(b.booking_count) - Number(a.booking_count))[0];

    const currentMonth = Number(fillRate.current_month || 0);
    const lastMonth = Number(fillRate.last_month || 0);
    const fillRateMoM = lastMonth > 0
      ? (((currentMonth - lastMonth) / lastMonth) * 100).toFixed(1)
      : "N/A";

    return {
      trend,
      monthlyVelocity: velocity.map(row => ({
        month: row.month,
        bookings: Number(row.total_bookings || 0),
        paidBookings: Number(row.paid_bookings || 0),
        revenue: Number(row.revenue || 0),
      })),
      peakDayOfWeek: peakDay ? peakDay.day_of_week?.trim() : "Unknown",
      dowPattern: dowPattern.map(row => ({
        day: row.day_of_week?.trim(),
        bookings: Number(row.booking_count || 0),
      })),
      leadTime: {
        avgDaysToBook: Number(leadTime.avg_days_to_book || 0),
        minDays: Number(leadTime.min_days || 0),
        maxDays: Number(leadTime.max_days || 0),
      },
      fillRate: {
        currentMonth,
        lastMonth,
        changePercent: fillRateMoM,
      },
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
