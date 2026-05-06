import { createPostgresClient } from "./postgresClient.js";

const isMissingRelationError = (error = {}) =>
  error.code === "42P01" || /relation .* does not exist/i.test(error.message || "");

const queryWithMissingTableFallback = async (client, sql, values, fallbackRows = []) => {
  try {
    return await client.query(sql, values);
  } catch (error) {
    if (isMissingRelationError(error)) {
      return { rows: fallbackRows, degraded: true };
    }

    throw error;
  }
};

/**
 * Calculates high-level commercial intelligence metrics using PostgreSQL as the primary source of truth.
 */
export const buildEcosystemIntelligenceReport = async (
  tenantId,
  env = globalThis.process?.env || {},
  options = {}
) => {
  const client = options.client || createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL client is not configured.");

  try {
    await client.connect();

    // 1. Funnel Aggregates
    const funnelResult = await client.query(`
      select 
        count(*) as total_inquiries,
        count(case when lead_stage = 'qualified' then 1 end) as qualified_leads,
        count(case when lead_stage = 'converted' then 1 end) as converted_leads
      from public.traveler_inquiry_records
      where tenant_id = $1
    `, [tenantId]);

    // 2. Revenue & Channel Performance
    const revenueResult = await client.query(`
      select 
        lead_source as source_channel,
        count(*) as booking_count,
        sum(total_price) as gross_revenue,
        avg(total_price) as average_booking_value
      from public.booking_records
      where tenant_id = $1 and revenue_stage != 'cancelled'
      group by lead_source
      order by gross_revenue desc
    `, [tenantId]);

    // 3. Partner Performance (Commissions)
    const partnerResult = await client.query(`
      select 
        case when referral_code = '' then 'Direct' else referral_code end as company_name,
        referral_code,
        count(source_id) as booking_count,
        sum(total_price) as total_attributed_revenue
      from public.booking_records
      where tenant_id = $1 and revenue_stage != 'cancelled'
      group by referral_code
      having count(source_id) > 0
      order by total_attributed_revenue desc
    `, [tenantId]);

    // 4. Network Health Metrics
    const networkResult = await queryWithMissingTableFallback(client, `
      select 
        count(*) as total_partnerships,
        count(case when status = 'active' then 1 end) as active_partnerships,
        sum(commission_percent) / nullif(count(*), 0) as average_commission
      from public.marketplace_partnership_records
      where provider_tenant_id = $1 or distributor_tenant_id = $1
    `, [tenantId], [
      { total_partnerships: 0, active_partnerships: 0, average_commission: 0 },
    ]);

    const funnel = funnelResult.rows[0] || {};
    const channels = revenueResult.rows || [];
    const partners = partnerResult.rows || [];
    const network = networkResult.rows[0] || { total_partnerships: 0, active_partnerships: 0, average_commission: 0 };

    const totalGrossRevenue = channels.reduce((acc, c) => acc + Number(c.gross_revenue || 0), 0);

    return {
      funnel: {
        totalInquiries: Number(funnel.total_inquiries || 0),
        qualifiedLeads: Number(funnel.qualified_leads || 0),
        convertedLeads: Number(funnel.converted_leads || 0),
        conversionRate: funnel.total_inquiries > 0 
          ? ((Number(funnel.converted_leads || 0) / Number(funnel.total_inquiries)) * 100).toFixed(1) + "%"
          : "0%",
      },
      revenue: {
        totalGross: totalGrossRevenue,
        channelBreakdown: channels.map(c => ({
          channel: c.source_channel || "direct",
          count: Number(c.booking_count || 0),
          revenue: Number(c.gross_revenue || 0),
          avgValue: Number(c.average_booking_value || 0),
          marketShare: totalGrossRevenue > 0 
            ? ((Number(c.gross_revenue || 0) / totalGrossRevenue) * 100).toFixed(1) + "%"
            : "0%",
        })),
      },
      partners: partners.map(p => ({
        name: p.company_name,
        code: p.referral_code,
        bookings: Number(p.booking_count || 0),
        revenue: Number(p.total_attributed_revenue || 0),
      })),
      network: {
        totalPartnerships: Number(network.total_partnerships || 0),
        activePartnerships: Number(network.active_partnerships || 0),
        averageCommission: Number(network.average_commission || 0).toFixed(1) + "%",
        degraded: Boolean(networkResult.degraded),
      },
      timestamp: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
