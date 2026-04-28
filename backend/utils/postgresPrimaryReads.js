import { createPostgresClient } from "./postgresClient.js";

const toNumber = (value, fallback = 0) =>
  value === null || value === undefined || value === "" ? fallback : Number(value);

const toIso = (value) => (value ? new Date(value).toISOString() : null);

export const normalizePrimaryPaymentRows = (rows = []) =>
  rows.map((row = {}) => {
    const payload = row.source_payload || {};
    const paidAt = toIso(row.paid_at);
    const refundedAt = toIso(row.refunded_at);
    const cancelledAt = toIso(row.cancelled_at);
    const failedAt = toIso(payload.failedAt);
    const updatedAt = toIso(row.updated_at || payload.updatedAt);

    return {
      _id: String(row.source_id || ""),
      bookingId: row.booking_id
        ? {
            _id: String(row.booking_id),
            name: String(row.booking_name || ""),
            revenueStage: String(row.booking_revenue_stage || ""),
            paymentStatus: String(row.booking_payment_status || ""),
          }
        : null,
      customerName: String(row.customer_name || ""),
      provider: String(row.provider || "stripe"),
      amount: toNumber(row.amount),
      currency: String(row.currency || "USD"),
      feePercent: toNumber(row.fee_percent),
      feeAmount: toNumber(row.fee_amount),
      providerReference: String(row.provider_reference || ""),
      status: String(row.status || "pending"),
      failureReason: String(row.failure_reason || ""),
      checkoutUrl: String(payload.checkoutUrl || ""),
      notes: String(payload.notes || ""),
      lifecycle: {
        status: String(row.status || "pending"),
        paidAt,
        failedAt,
        cancelledAt,
        refundedAt,
        paymentUpdatedAt: refundedAt || paidAt || failedAt || cancelledAt || updatedAt,
      },
      paymentSummary: {
        summary: `${String(row.provider || "stripe").toUpperCase()} ${String(row.currency || "USD")} ${toNumber(row.amount).toLocaleString()} ${String(row.status || "pending")}`,
      },
    };
  });

export const normalizePrimaryInquiryRows = (rows = []) =>
  rows.map((row = {}) => {
    const payload = row.source_payload || {};
    return {
      _id: String(row.source_id || ""),
      tenantId: String(row.tenant_id || ""),
      name: String(row.traveler_name || ""),
      firstName: String(row.first_name || ""),
      lastName: String(row.last_name || ""),
      email: String(row.email || ""),
      phone: String(row.phone || ""),
      destinations: Array.isArray(row.destinations) ? row.destinations : [],
      travelWhen: String(row.travel_when || ""),
      budget: String(row.budget || ""),
      leadStage: String(row.lead_stage || "new"),
      status: String(row.status || "Pending"),
      sourceChannel: String(row.source_channel || "website"),
      campaignLabel: String(row.campaign_label || ""),
      referralCode: String(row.referral_code || ""),
      leadScore: toNumber(row.lead_score),
      leadTemperature: String(row.lead_temperature || "cold"),
      message: String(payload.message || ""),
      contactPreference: String(payload.contactPreference || "whatsapp"),
      followUpMessage: String(payload.followUpMessage || ""),
      automationSummary: String(payload.automationSummary || ""),
    };
  });

export const fetchPrimaryPayments = async (tenantId = "", env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          pr.source_id,
          pr.booking_id,
          pr.provider,
          pr.provider_reference,
          pr.customer_name,
          pr.status,
          pr.currency,
          pr.amount,
          pr.fee_percent,
          pr.fee_amount,
          pr.failure_reason,
          pr.paid_at,
          pr.refunded_at,
          pr.cancelled_at,
          pr.source_payload,
          pr.updated_at,
          br.traveler_name as booking_name,
          br.revenue_stage as booking_revenue_stage,
          br.payment_status as booking_payment_status
        from public.payment_records pr
        left join public.booking_records br
          on br.source_id = pr.booking_id and br.tenant_id = pr.tenant_id
        where pr.tenant_id = $1
        order by pr.updated_at desc
      `,
      [tenantId]
    );
    return normalizePrimaryPaymentRows(result.rows);
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryInquiries = async (tenantId = "", env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          traveler_name,
          first_name,
          last_name,
          email,
          phone,
          coalesce(
            (
              select array_agg(value order by value)
              from jsonb_array_elements_text(destinations) value
            ),
            array[]::text[]
          ) as destinations,
          travel_when,
          budget,
          lead_stage,
          status,
          source_channel,
          campaign_label,
          referral_code,
          lead_score,
          lead_temperature,
          source_payload
        from public.traveler_inquiry_records
        where tenant_id = $1
        order by updated_at desc
      `,
      [tenantId]
    );
    return normalizePrimaryInquiryRows(result.rows);
  } finally {
    await client.end().catch(() => {});
  }
};
