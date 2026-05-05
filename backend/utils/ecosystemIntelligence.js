import { createPostgresClient } from "./postgresClient.js";

/**
 * Calculates high-level commercial intelligence metrics using PostgreSQL as the primary source of truth.
 */
export const buildEcosystemIntelligenceReport = async (tenantId, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
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
        p.company_name,
        p.referral_code,
        count(b.source_id) as booking_count,
        sum(b.total_price) as total_attributed_revenue
      from public.partner_account_records p
      left join public.booking_records b 
        on b.referral_code = p.referral_code and b.tenant_id = p.tenant_id
      where p.tenant_id = $1
      group by p.company_name, p.referral_code
      having count(b.source_id) > 0
      order by total_attributed_revenue desc
    `, [tenantId]);

    const funnel = funnelResult.rows[0] || {};
    const channels = revenueResult.rows || [];
    const partners = partnerResult.rows || [];

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
      timestamp: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
