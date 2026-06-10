import { createPostgresClient } from "./postgresClient.js";
import {
  normalizePrimaryBookingRows,
  normalizePrimaryPaymentRows,
} from "./postgresPrimaryReads.js";

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL revenue writer is not configured.");
  }

  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const deleteRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL revenue writer is not configured.");
  }

  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const querySingleRow = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL revenue writer is not configured.");
  }

  try {
    await client.connect();
    const result = await client.query(statement.text, statement.values);
    return result.rows[0] || null;
  } finally {
    await client.end().catch(() => {});
  }
};

const toIso = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const isMissingColumnError = (error, columnName = "") =>
  error?.code === "42703" ||
  String(error?.message || "").toLowerCase().includes(`column "${String(columnName).toLowerCase()}"`);

export const buildBookingRevenueRecord = (booking = {}) => ({
  sourceId: String(booking._id || ""),
  tenantId: String(booking.tenantId || ""),
  quoteProposalId: booking.quoteProposalId ? String(booking.quoteProposalId) : "",
  travelerName: booking.name || "",
  email: booking.email || "",
  phone: booking.phone || "",
  packageTour: booking.packageTour || "",
  status: booking.status || "Pending",
  revenueStage: booking.revenueStage || "new",
  paymentStatus: booking.paymentStatus || "not-started",
  totalPrice: Number(booking.totalPrice || 0),
  currency: "USD",
  referralCode: booking.referralCode || "",
  leadSource: booking.leadSource || "",
  campaignLabel: booking.campaignLabel || "",
  firstTouchAt: booking.firstTouchAt ? new Date(booking.firstTouchAt).toISOString() : null,
  convertedAt: booking.convertedAt ? new Date(booking.convertedAt).toISOString() : null,
  travelDate: booking.travelDate ? new Date(booking.travelDate).toISOString() : null,
  itineraryMediaId: booking.itineraryMediaId ? String(booking.itineraryMediaId) : "",
  distributorTenantId: booking.distributorTenantId ? String(booking.distributorTenantId) : "",
  marketplaceCommissionPercent: Number(booking.marketplaceCommissionPercent || 0),
  sourcePayload: booking,
});

export const buildQuoteRevenueRecord = (quote = {}) => ({
  sourceId: String(quote._id || ""),
  tenantId: String(quote.tenantId || ""),
  inquiryId: quote.inquiryId ? String(quote.inquiryId) : "",
  bookingId: quote.bookingId ? String(quote.bookingId) : "",
  title: quote.title || "",
  travelerName: quote.travelerName || "",
  status: quote.status || "draft",
  conversionStage: quote.conversionStage || "draft",
  paymentStatus: quote.paymentStatus || "not-started",
  currency: quote.currency || "USD",
  totalPrice: Number(quote.totalPrice || 0),
  publicToken: quote.publicToken || "",
  validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString() : null,
  sentAt: quote.sentAt ? new Date(quote.sentAt).toISOString() : null,
  acceptedAt: quote.acceptedAt ? new Date(quote.acceptedAt).toISOString() : null,
  pdfMediaId: quote.pdfMediaId ? String(quote.pdfMediaId) : "",
  sourcePayload: quote,
});

export const buildPaymentRevenueRecord = (payment = {}) => ({
  sourceId: String(payment._id || ""),
  tenantId: String(payment.tenantId || ""),
  bookingId: payment.bookingId ? String(payment.bookingId) : "",
  provider: payment.provider || "stripe",
  publicToken: payment.publicToken || "",
  providerReference: payment.providerReference || "",
  customerName: payment.customerName || "",
  status: payment.status || "pending",
  currency: payment.currency || "USD",
  amount: Number(payment.amount || 0),
  feePercent: Number(payment.feePercent || 0),
  feeAmount: Number(payment.feeAmount || 0),
  failureReason: payment.failureReason || "",
  paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
  refundedAt: payment.refundedAt ? new Date(payment.refundedAt).toISOString() : null,
  cancelledAt: payment.cancelledAt ? new Date(payment.cancelledAt).toISOString() : null,
  invoiceMediaId: payment.invoiceMediaId ? String(payment.invoiceMediaId) : "",
  marketplacePayoutAmount: Number(payment.marketplacePayoutAmount || 0),
  checkoutKind: String(payment.checkoutKind || ""),
  sourcePayload: payment,
});

export const buildBookingRevenueUpsert = (booking = {}) => {
  const record = buildBookingRevenueRecord(booking);
  return {
    text: `
      insert into public.booking_records (
        source_id, tenant_id, quote_proposal_id, traveler_name, email, phone, package_tour,
        status, revenue_stage, payment_status, total_price, currency, referral_code, lead_source,
        campaign_label, first_touch_at, converted_at, travel_date, itinerary_media_id,
        distributor_tenant_id, marketplace_commission_percent, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        quote_proposal_id = excluded.quote_proposal_id,
        traveler_name = excluded.traveler_name,
        email = excluded.email,
        phone = excluded.phone,
        package_tour = excluded.package_tour,
        status = excluded.status,
        revenue_stage = excluded.revenue_stage,
        payment_status = excluded.payment_status,
        total_price = excluded.total_price,
        currency = excluded.currency,
        referral_code = excluded.referral_code,
        lead_source = excluded.lead_source,
        campaign_label = excluded.campaign_label,
        first_touch_at = excluded.first_touch_at,
        converted_at = excluded.converted_at,
        travel_date = excluded.travel_date,
        itinerary_media_id = excluded.itinerary_media_id,
        distributor_tenant_id = excluded.distributor_tenant_id,
        marketplace_commission_percent = excluded.marketplace_commission_percent,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId, record.tenantId, record.quoteProposalId || null, record.travelerName, record.email,
      record.phone, record.packageTour, record.status, record.revenueStage, record.paymentStatus,
      record.totalPrice, record.currency, record.referralCode, record.leadSource, record.campaignLabel,
      record.firstTouchAt, record.convertedAt, record.travelDate, record.itineraryMediaId || null, 
      record.distributorTenantId || null, record.marketplaceCommissionPercent, JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildLegacyBookingRevenueUpsert = (booking = {}) => {
  const record = buildBookingRevenueRecord(booking);
  return {
    text: `
      insert into public.booking_records (
        source_id, tenant_id, quote_proposal_id, traveler_name, email, phone, package_tour,
        status, revenue_stage, payment_status, total_price, currency, referral_code, lead_source,
        campaign_label, first_touch_at, converted_at, travel_date,
        source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        quote_proposal_id = excluded.quote_proposal_id,
        traveler_name = excluded.traveler_name,
        email = excluded.email,
        phone = excluded.phone,
        package_tour = excluded.package_tour,
        status = excluded.status,
        revenue_stage = excluded.revenue_stage,
        payment_status = excluded.payment_status,
        total_price = excluded.total_price,
        currency = excluded.currency,
        referral_code = excluded.referral_code,
        lead_source = excluded.lead_source,
        campaign_label = excluded.campaign_label,
        first_touch_at = excluded.first_touch_at,
        converted_at = excluded.converted_at,
        travel_date = excluded.travel_date,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId, record.tenantId, record.quoteProposalId || null, record.travelerName, record.email,
      record.phone, record.packageTour, record.status, record.revenueStage, record.paymentStatus,
      record.totalPrice, record.currency, record.referralCode, record.leadSource, record.campaignLabel,
      record.firstTouchAt, record.convertedAt, record.travelDate,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildQuoteRevenueUpsert = (quote = {}) => {
  const record = buildQuoteRevenueRecord(quote);
  return {
    text: `
      insert into public.quote_records (
        source_id, tenant_id, inquiry_id, booking_id, title, traveler_name, status,
        conversion_stage, payment_status, currency, total_price, public_token, valid_until, sent_at, accepted_at, pdf_media_id, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        inquiry_id = excluded.inquiry_id,
        booking_id = excluded.booking_id,
        title = excluded.title,
        traveler_name = excluded.traveler_name,
        status = excluded.status,
        conversion_stage = excluded.conversion_stage,
        payment_status = excluded.payment_status,
        currency = excluded.currency,
        total_price = excluded.total_price,
        public_token = excluded.public_token,
        valid_until = excluded.valid_until,
        sent_at = excluded.sent_at,
        accepted_at = excluded.accepted_at,
        pdf_media_id = excluded.pdf_media_id,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId, record.tenantId, record.inquiryId || null, record.bookingId || null, record.title,
      record.travelerName, record.status, record.conversionStage, record.paymentStatus, record.currency,
      record.totalPrice, record.publicToken, record.validUntil, record.sentAt, record.acceptedAt, 
      record.pdfMediaId || null, JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildLegacyQuoteRevenueUpsert = (quote = {}) => {
  const record = buildQuoteRevenueRecord(quote);
  return {
    text: `
      insert into public.quote_records (
        source_id, tenant_id, inquiry_id, booking_id, title, traveler_name, status,
        conversion_stage, payment_status, currency, total_price, public_token, valid_until, sent_at, accepted_at, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        inquiry_id = excluded.inquiry_id,
        booking_id = excluded.booking_id,
        title = excluded.title,
        traveler_name = excluded.traveler_name,
        status = excluded.status,
        conversion_stage = excluded.conversion_stage,
        payment_status = excluded.payment_status,
        currency = excluded.currency,
        total_price = excluded.total_price,
        public_token = excluded.public_token,
        valid_until = excluded.valid_until,
        sent_at = excluded.sent_at,
        accepted_at = excluded.accepted_at,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId, record.tenantId, record.inquiryId || null, record.bookingId || null, record.title,
      record.travelerName, record.status, record.conversionStage, record.paymentStatus, record.currency,
      record.totalPrice, record.publicToken, record.validUntil, record.sentAt, record.acceptedAt,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildPaymentRevenueUpsert = (payment = {}) => {
  const record = buildPaymentRevenueRecord(payment);
  return {
    text: `
      insert into public.payment_records (
        source_id, tenant_id, booking_id, provider, public_token, provider_reference, customer_name, status,
        currency, amount, fee_percent, fee_amount, failure_reason, paid_at, refunded_at, cancelled_at, invoice_media_id,
        marketplace_payout_amount, checkout_kind, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        booking_id = excluded.booking_id,
        provider = excluded.provider,
        public_token = excluded.public_token,
        provider_reference = excluded.provider_reference,
        customer_name = excluded.customer_name,
        status = excluded.status,
        currency = excluded.currency,
        amount = excluded.amount,
        fee_percent = excluded.fee_percent,
        fee_amount = excluded.fee_amount,
        failure_reason = excluded.failure_reason,
        paid_at = excluded.paid_at,
        refunded_at = excluded.refunded_at,
        cancelled_at = excluded.cancelled_at,
        invoice_media_id = excluded.invoice_media_id,
        marketplace_payout_amount = excluded.marketplace_payout_amount,
        checkout_kind = excluded.checkout_kind,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId, record.tenantId, record.bookingId || null, record.provider, record.publicToken, record.providerReference,
      record.customerName, record.status, record.currency, record.amount, record.feePercent, record.feeAmount,
      record.failureReason, record.paidAt, record.refundedAt, record.cancelledAt, record.invoiceMediaId || null,
      record.marketplacePayoutAmount, record.checkoutKind, JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildLegacyPaymentRevenueUpsert = (payment = {}) => {
  const record = buildPaymentRevenueRecord(payment);
  return {
    text: `
      insert into public.payment_records (
        source_id, tenant_id, booking_id, provider, public_token, provider_reference, customer_name, status,
        currency, amount, fee_percent, fee_amount, failure_reason, paid_at, refunded_at, cancelled_at,
        source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        booking_id = excluded.booking_id,
        provider = excluded.provider,
        public_token = excluded.public_token,
        provider_reference = excluded.provider_reference,
        customer_name = excluded.customer_name,
        status = excluded.status,
        currency = excluded.currency,
        amount = excluded.amount,
        fee_percent = excluded.fee_percent,
        fee_amount = excluded.fee_amount,
        failure_reason = excluded.failure_reason,
        paid_at = excluded.paid_at,
        refunded_at = excluded.refunded_at,
        cancelled_at = excluded.cancelled_at,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId, record.tenantId, record.bookingId || null, record.provider, record.publicToken, record.providerReference,
      record.customerName, record.status, record.currency, record.amount, record.feePercent, record.feeAmount,
      record.failureReason, record.paidAt, record.refundedAt, record.cancelledAt,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildBookingRevenueDelete = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    delete from public.booking_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildQuoteRevenueDelete = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    delete from public.quote_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildPaymentRevenueDelete = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    delete from public.payment_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildQuotePublicTokenLookup = ({ publicToken = "" } = {}) => ({
  text: `
    select source_id, tenant_id, inquiry_id, booking_id, status, conversion_stage, public_token
    from public.quote_records
    where public_token = $1
    limit 1
  `,
  values: [String(publicToken || "")],
});

export const buildQuoteRevenueLookup = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    select
      source_id,
      tenant_id,
      inquiry_id,
      booking_id,
      title,
      traveler_name,
      status,
      conversion_stage,
      payment_status,
      currency,
      total_price,
      public_token,
      valid_until,
      sent_at,
      accepted_at,
      pdf_media_id,
      source_payload
    from public.quote_records
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildLegacyQuoteRevenueLookup = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    select
      source_id,
      tenant_id,
      inquiry_id,
      booking_id,
      title,
      traveler_name,
      status,
      conversion_stage,
      payment_status,
      currency,
      total_price,
      public_token,
      valid_until,
      sent_at,
      accepted_at,
      source_payload,
      created_at,
      updated_at
    from public.quote_records
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildBookingRevenueLookup = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    select
      source_id,
      tenant_id,
      quote_proposal_id,
      traveler_name,
      email,
      phone,
      package_tour,
      status,
      revenue_stage,
      payment_status,
      total_price,
      currency,
      referral_code,
      lead_source,
      campaign_label,
      first_touch_at,
      converted_at,
      travel_date,
      itinerary_media_id,
      source_payload,
      created_at,
      updated_at
    from public.booking_records
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildLegacyBookingRevenueLookup = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    select
      source_id,
      tenant_id,
      quote_proposal_id,
      traveler_name,
      email,
      phone,
      package_tour,
      status,
      revenue_stage,
      payment_status,
      total_price,
      currency,
      referral_code,
      lead_source,
      campaign_label,
      first_touch_at,
      converted_at,
      travel_date,
      source_payload,
      created_at,
      updated_at
    from public.booking_records
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildPaymentPublicTokenLookup = ({ publicToken = "" } = {}) => ({
  text: `
    select
      pr.source_id,
      pr.tenant_id,
      pr.booking_id,
      pr.status,
      pr.provider,
      pr.public_token,
      pr.provider_reference,
      pr.customer_name,
      pr.currency,
      pr.amount,
      pr.fee_percent,
      pr.fee_amount,
      pr.failure_reason,
      pr.paid_at,
      pr.refunded_at,
      pr.cancelled_at,
      pr.invoice_media_id,
      pr.updated_at,
      pr.source_payload,
      br.traveler_name as booking_name,
      br.package_tour as booking_package_tour
    from public.payment_records pr
    left join public.booking_records br
      on br.source_id = pr.booking_id and br.tenant_id = pr.tenant_id
    where pr.public_token = $1
    limit 1
  `,
  values: [String(publicToken || "")],
});

export const buildPaymentRevenueLookup = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
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
      pr.invoice_media_id,
      pr.source_payload,
      pr.updated_at,
      br.traveler_name as booking_name,
      br.package_tour as booking_package_tour,
      br.status as booking_status,
      br.revenue_stage as booking_revenue_stage,
      br.payment_status as booking_payment_status,
      br.quote_proposal_id as booking_quote_proposal_id,
      qr.title as quote_title,
      qr.status as quote_status,
      qr.conversion_stage as quote_conversion_stage,
      qr.payment_status as quote_payment_status
    from public.payment_records pr
    left join public.booking_records br
      on br.source_id = pr.booking_id and br.tenant_id = pr.tenant_id
    left join public.quote_records qr
      on qr.source_id = br.quote_proposal_id and qr.tenant_id = pr.tenant_id
    where pr.source_id = $1 and pr.tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildLegacyPaymentRevenueLookup = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
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
      br.package_tour as booking_package_tour,
      br.status as booking_status,
      br.revenue_stage as booking_revenue_stage,
      br.payment_status as booking_payment_status,
      br.quote_proposal_id as booking_quote_proposal_id,
      qr.title as quote_title,
      qr.status as quote_status,
      qr.conversion_stage as quote_conversion_stage,
      qr.payment_status as quote_payment_status
    from public.payment_records pr
    left join public.booking_records br
      on br.source_id = pr.booking_id and br.tenant_id = pr.tenant_id
    left join public.quote_records qr
      on qr.source_id = br.quote_proposal_id and qr.tenant_id = pr.tenant_id
    where pr.source_id = $1 and pr.tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildLegacyPaymentPublicTokenLookup = ({ publicToken = "" } = {}) => ({
  text: `
    select
      pr.source_id,
      pr.tenant_id,
      pr.booking_id,
      pr.status,
      pr.provider,
      pr.public_token,
      pr.provider_reference,
      pr.customer_name,
      pr.currency,
      pr.amount,
      pr.fee_percent,
      pr.fee_amount,
      pr.failure_reason,
      pr.paid_at,
      pr.refunded_at,
      pr.cancelled_at,
      pr.updated_at,
      pr.source_payload,
      br.traveler_name as booking_name,
      br.package_tour as booking_package_tour
    from public.payment_records pr
    left join public.booking_records br
      on br.source_id = pr.booking_id and br.tenant_id = pr.tenant_id
    where pr.public_token = $1
    limit 1
  `,
  values: [String(publicToken || "")],
});

export const buildPaymentProviderReferenceLookup = ({
  provider = "",
  providerReference = "",
} = {}) => ({
  text: `
    select
      pr.source_id,
      pr.tenant_id,
      pr.booking_id,
      pr.status,
      pr.provider,
      pr.public_token,
      pr.provider_reference,
      pr.customer_name,
      pr.currency,
      pr.amount,
      pr.fee_percent,
      pr.fee_amount,
      pr.failure_reason,
      pr.paid_at,
      pr.refunded_at,
      pr.cancelled_at,
      pr.invoice_media_id,
      pr.updated_at,
      pr.source_payload,
      br.traveler_name as booking_name,
      br.package_tour as booking_package_tour
    from public.payment_records pr
    left join public.booking_records br
      on br.source_id = pr.booking_id and br.tenant_id = pr.tenant_id
    where pr.provider = $1
      and pr.provider_reference = $2
    limit 1
  `,
  values: [String(provider || ""), String(providerReference || "")],
});

export const buildLegacyPaymentProviderReferenceLookup = ({
  provider = "",
  providerReference = "",
} = {}) => ({
  text: `
    select
      pr.source_id,
      pr.tenant_id,
      pr.booking_id,
      pr.status,
      pr.provider,
      pr.public_token,
      pr.provider_reference,
      pr.customer_name,
      pr.currency,
      pr.amount,
      pr.fee_percent,
      pr.fee_amount,
      pr.failure_reason,
      pr.paid_at,
      pr.refunded_at,
      pr.cancelled_at,
      pr.updated_at,
      pr.source_payload,
      br.traveler_name as booking_name,
      br.package_tour as booking_package_tour
    from public.payment_records pr
    left join public.booking_records br
      on br.source_id = pr.booking_id and br.tenant_id = pr.tenant_id
    where pr.provider = $1
      and pr.provider_reference = $2
    limit 1
  `,
  values: [String(provider || ""), String(providerReference || "")],
});

export const buildPublicQuoteRevenueView = (row = {}) => {
  const payload = row.source_payload || {};

  return {
    ...payload,
    _id: String(row.source_id || payload._id || ""),
    tenantId: String(row.tenant_id || payload.tenantId || ""),
    inquiryId: row.inquiry_id ? String(row.inquiry_id) : payload.inquiryId || null,
    bookingId: row.booking_id ? String(row.booking_id) : payload.bookingId || null,
    title: String(row.title || payload.title || ""),
    travelerName: String(row.traveler_name || payload.travelerName || ""),
    status: String(row.status || payload.status || "draft"),
    conversionStage: String(row.conversion_stage || payload.conversionStage || "draft"),
    paymentStatus: String(row.payment_status || payload.paymentStatus || "not-started"),
    currency: String(row.currency || payload.currency || "USD"),
    totalPrice: Number(row.total_price ?? payload.totalPrice ?? 0),
    publicToken: String(row.public_token || payload.publicToken || ""),
    validUntil: toIso(row.valid_until || payload.validUntil),
    sentAt: toIso(row.sent_at || payload.sentAt),
    acceptedAt: toIso(row.accepted_at || payload.acceptedAt),
    pdfMediaId: String(row.pdf_media_id || payload.pdfMediaId || ""),
    travelerCount: Number(payload.travelerCount || 0),
    tripLengthDays: Number(payload.tripLengthDays || 0),
    itineraryOutline: Array.isArray(payload.itineraryOutline) ? payload.itineraryOutline : [],
    nextSteps: Array.isArray(payload.nextSteps) ? payload.nextSteps : [],
    lineItems: Array.isArray(payload.lineItems) ? payload.lineItems : [],
  };
};

export const buildPublicPaymentRevenueView = (row = {}) => {
  const payload = row.source_payload || {};
  const paidAt = toIso(row.paid_at || payload.paidAt);
  const refundedAt = toIso(row.refunded_at || payload.refundedAt);
  const cancelledAt = toIso(row.cancelled_at || payload.cancelledAt);
  const failedAt = toIso(payload.failedAt);
  const updatedAt = toIso(row.updated_at || payload.updatedAt);
  const status = String(row.status || payload.status || "pending");
  const provider = String(row.provider || payload.provider || "stripe");
  const currency = String(row.currency || payload.currency || "USD");
  const amount = Number(row.amount ?? payload.amount ?? 0);

  return {
    ...payload,
    _id: String(row.source_id || payload._id || ""),
    tenantId: String(row.tenant_id || payload.tenantId || ""),
    bookingId: row.booking_id
      ? {
          _id: String(row.booking_id),
          name: String(row.booking_name || payload.bookingId?.name || ""),
          packageTour: String(row.booking_package_tour || payload.bookingId?.packageTour || ""),
        }
      : payload.bookingId || null,
    provider,
    publicToken: String(row.public_token || payload.publicToken || ""),
    providerReference: String(row.provider_reference || payload.providerReference || ""),
    accommodationReservationId: payload.accommodationReservationId
      ? String(payload.accommodationReservationId)
      : null,
    checkoutKind: String(payload.checkoutKind || ""),
    customerName: String(row.customer_name || payload.customerName || ""),
    status,
    currency,
    amount,
    feePercent: Number(row.fee_percent ?? payload.feePercent ?? 0),
    feeAmount: Number(row.fee_amount ?? payload.feeAmount ?? 0),
    failureReason: String(row.failure_reason || payload.failureReason || ""),
    checkoutUrl: String(payload.checkoutUrl || ""),
    notes: String(payload.notes || ""),
    lifecycle: {
      status,
      paidAt,
      failedAt,
      cancelledAt,
      refundedAt,
      paymentUpdatedAt: refundedAt || paidAt || failedAt || cancelledAt || updatedAt,
    },
    paymentSummary: {
      summary: `${provider.toUpperCase()} ${currency} ${amount.toLocaleString()} ${status}`,
    },
  };
};

export const buildQuoteRevenueView = (row = {}) =>
  buildPublicQuoteRevenueView(row);

export const buildBookingRevenueView = (row = {}) =>
  normalizePrimaryBookingRows([row])[0] || null;

export const buildPaymentRevenueView = (row = {}) =>
  normalizePrimaryPaymentRows([row])[0] || null;

export const syncBookingRevenueRecord = async (booking, env) => {
  try {
    await upsertRecord(buildBookingRevenueUpsert(booking), env);
  } catch (error) {
    if (!isMissingColumnError(error, "itinerary_media_id")) {
      throw error;
    }

    await upsertRecord(buildLegacyBookingRevenueUpsert(booking), env);
  }
};

export const syncQuoteRevenueRecord = async (quote, env) => {
  try {
    await upsertRecord(buildQuoteRevenueUpsert(quote), env);
  } catch (error) {
    if (!isMissingColumnError(error, "pdf_media_id")) {
      throw error;
    }

    await upsertRecord(buildLegacyQuoteRevenueUpsert(quote), env);
  }
};

export const syncPaymentRevenueRecord = async (payment, env) => {
  try {
    await upsertRecord(buildPaymentRevenueUpsert(payment), env);
  } catch (error) {
    if (!isMissingColumnError(error, "invoice_media_id")) {
      throw error;
    }

    await upsertRecord(buildLegacyPaymentRevenueUpsert(payment), env);
  }
};

export const deleteBookingRevenueRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildBookingRevenueDelete({ sourceId, tenantId }), env);

export const deleteQuoteRevenueRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildQuoteRevenueDelete({ sourceId, tenantId }), env);

export const deletePaymentRevenueRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildPaymentRevenueDelete({ sourceId, tenantId }), env);

export const findQuoteRevenueRecordByPublicToken = (publicToken, env) =>
  querySingleRow(buildQuotePublicTokenLookup({ publicToken }), env);

export const findQuoteRevenueRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildQuoteRevenueLookup({ sourceId, tenantId }), env).catch((error) => {
    if (!isMissingColumnError(error, "pdf_media_id")) {
      throw error;
    }

    return querySingleRow(buildLegacyQuoteRevenueLookup({ sourceId, tenantId }), env);
  });

export const findBookingRevenueRecord = async (sourceId, tenantId, env) => {
  try {
    return await querySingleRow(buildBookingRevenueLookup({ sourceId, tenantId }), env);
  } catch (error) {
    if (!isMissingColumnError(error, "itinerary_media_id")) {
      throw error;
    }

    return querySingleRow(buildLegacyBookingRevenueLookup({ sourceId, tenantId }), env);
  }
};

export const findPaymentRevenueRecordByPublicToken = (publicToken, env) =>
  querySingleRow(buildPaymentPublicTokenLookup({ publicToken }), env).catch((error) => {
    if (!isMissingColumnError(error, "invoice_media_id")) {
      throw error;
    }

    return querySingleRow(buildLegacyPaymentPublicTokenLookup({ publicToken }), env);
  });

export const findPaymentRevenueRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildPaymentRevenueLookup({ sourceId, tenantId }), env).catch((error) => {
    if (!isMissingColumnError(error, "invoice_media_id")) {
      throw error;
    }

    return querySingleRow(buildLegacyPaymentRevenueLookup({ sourceId, tenantId }), env);
  });

export const findPaymentRevenueRecordByProviderReference = (provider, providerReference, env) =>
  querySingleRow(buildPaymentProviderReferenceLookup({ provider, providerReference }), env).catch((error) => {
    if (!isMissingColumnError(error, "invoice_media_id")) {
      throw error;
    }

    return querySingleRow(
      buildLegacyPaymentProviderReferenceLookup({ provider, providerReference }),
      env,
    );
  });
