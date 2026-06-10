import { createPostgresClient } from "./postgresClient.js";

/**
 * Build a commission report for a tenant from PostgreSQL payment_records.
 * Queries payments with marketplace_payout_amount > 0 and aggregates by property.
 */
export const fetchCommissionReport = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);

  if (!client) {
    return { configured: false };
  }

  await client.connect();

  try {
    // ── Summary ─────────────────────────────────────────────────────
    const summaryQuery = {
      text: `
        select
          count(*)::int as total_transactions,
          coalesce(sum(marketplace_payout_amount), 0) as total_commission,
          coalesce(avg(marketplace_payout_amount), 0) as avg_commission
        from public.payment_records
        where tenant_id = $1
          and marketplace_payout_amount > 0
      `,
      values: [tenantId],
    };

    // ── Breakdown by property (from source_payload JSONB) ───────────
    // Hotel payments: source_payload->>notes contains the hotel name
    // Restaurant payments: source_payload#>'{sourceMeta,restaurantName}' extracts the restaurant name
    const propertyBreakdownQuery = {
      text: `
        select
          coalesce(
            source_payload#>>'{sourceMeta,restaurantName}',
            source_payload#>>'{sourceMeta,hotelName}',
            substring(source_payload->>'_id' from 1 for 20),
            'Unknown property'
          ) as property_name,
          source_payload->>'checkoutKind' as checkout_kind,
          count(*)::int as transaction_count,
          coalesce(sum(marketplace_payout_amount), 0) as total_commission,
          coalesce(avg(marketplace_payout_amount), 0) as avg_commission_per_txn,
          coalesce(avg(source_payload->>'marketplaceCommissionPercent')::numeric, 0) as avg_commission_percent
        from public.payment_records
        where tenant_id = $1
          and marketplace_payout_amount > 0
        group by
          coalesce(
            source_payload#>>'{sourceMeta,restaurantName}',
            source_payload#>>'{sourceMeta,hotelName}',
            substring(source_payload->>'_id' from 1 for 20),
            'Unknown property'
          ),
          source_payload->>'checkoutKind'
        order by total_commission desc
      `,
      values: [tenantId],
    };

    // ── Recent commission transactions ──────────────────────────────
    const recentQuery = {
      text: `
        select
          source_id,
          customer_name,
          amount,
          currency,
          marketplace_payout_amount,
          status,
          source_payload->>'checkoutKind' as checkout_kind,
          coalesce(
            source_payload#>>'{sourceMeta,restaurantName}',
            source_payload#>>'{sourceMeta,hotelName}',
            substring(notes from 'deposit for (.+?)\\s\\('),
            'Unknown property'
          ) as property_name,
          updated_at,
          created_at
        from public.payment_records
        where tenant_id = $1
          and marketplace_payout_amount > 0
        order by updated_at desc
        limit 25
      `,
      values: [tenantId],
    };

    const [summaryResult, breakdownResult, recentResult] = await Promise.all([
      client.query(summaryQuery.text, summaryQuery.values),
      client.query(propertyBreakdownQuery.text, propertyBreakdownQuery.values),
      client.query(recentQuery.text, recentQuery.values),
    ]);

    const summary = summaryResult.rows[0] || {
      totalTransactions: 0,
      totalCommission: 0,
      avgCommission: 0,
    };

    const byProperty = breakdownResult.rows.map((row) => ({
      propertyName: String(row.property_name || ""),
      checkoutKind: String(row.checkout_kind || ""),
      transactionCount: Number(row.transaction_count || 0),
      totalCommission: Number(row.total_commission || 0),
      avgCommissionPerTxn: Number(row.avg_commission_per_txn || 0),
      avgCommissionPercent: Number(row.avg_commission_percent || 0),
    }));

    const recentTransactions = recentResult.rows.map((row) => ({
      sourceId: String(row.source_id || ""),
      customerName: String(row.customer_name || ""),
      amount: Number(row.amount || 0),
      currency: String(row.currency || "USD"),
      payoutAmount: Number(row.marketplace_payout_amount || 0),
      status: String(row.status || ""),
      checkoutKind: String(row.checkout_kind || ""),
      propertyName: String(row.property_name || ""),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    }));

    return {
      configured: true,
      summary: {
        totalTransactions: Number(summary.total_transactions || 0),
        totalCommission: Number(summary.total_commission || 0),
        avgCommission: Number(summary.avg_commission || 0),
        partneredProperties: byProperty.length,
      },
      byProperty,
      recentTransactions,
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end().catch(() => {});
  }
};

export default fetchCommissionReport;
