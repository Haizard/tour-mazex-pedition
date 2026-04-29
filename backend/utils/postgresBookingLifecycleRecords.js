import { createPostgresClient } from "./postgresClient.js";

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL booking lifecycle writer is not configured.");
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
    throw new Error("PostgreSQL booking lifecycle writer is not configured.");
  }

  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

export const buildReviewRequestRecord = (reviewRequest = {}) => ({
  sourceId: String(reviewRequest._id || ""),
  tenantId: String(reviewRequest.tenantId || ""),
  bookingId: String(reviewRequest.bookingId || ""),
  guestName: reviewRequest.guestName || "",
  guestEmail: reviewRequest.guestEmail || "",
  bookingLabel: reviewRequest.bookingLabel || "",
  subject: reviewRequest.subject || "",
  message: reviewRequest.message || "",
  status: reviewRequest.status || "draft",
  platforms: Array.isArray(reviewRequest.platforms) ? reviewRequest.platforms : [],
  sendWindowLabel: reviewRequest.sendWindowLabel || "",
  nextStepChecklist: Array.isArray(reviewRequest.nextStepChecklist)
    ? reviewRequest.nextStepChecklist
    : [],
  sentAt: reviewRequest.sentAt ? new Date(reviewRequest.sentAt).toISOString() : null,
  completedAt: reviewRequest.completedAt ? new Date(reviewRequest.completedAt).toISOString() : null,
  sourcePayload: reviewRequest,
});

export const buildRepeatCustomerCampaignRecord = (campaign = {}) => ({
  sourceId: String(campaign._id || ""),
  tenantId: String(campaign.tenantId || ""),
  bookingId: String(campaign.bookingId || ""),
  guestName: campaign.guestName || "",
  guestEmail: campaign.guestEmail || "",
  bookingLabel: campaign.bookingLabel || "",
  campaignType: campaign.campaignType || "referral",
  audienceTag: campaign.audienceTag || "",
  segment: campaign.segment || "First-Timer",
  channel: campaign.channel || "email",
  offerLabel: campaign.offerLabel || "",
  subject: campaign.subject || "",
  message: campaign.message || "",
  status: campaign.status || "draft",
  recommendedSendAtLabel: campaign.recommendedSendAtLabel || "",
  nextStepChecklist: Array.isArray(campaign.nextStepChecklist)
    ? campaign.nextStepChecklist
    : [],
  sentAt: campaign.sentAt ? new Date(campaign.sentAt).toISOString() : null,
  convertedAt: campaign.convertedAt ? new Date(campaign.convertedAt).toISOString() : null,
  sourcePayload: campaign,
});

export const buildReviewRequestUpsert = (reviewRequest = {}) => {
  const record = buildReviewRequestRecord(reviewRequest);

  return {
    text: `
      insert into public.review_request_records (
        source_id, tenant_id, booking_id, guest_name, guest_email, booking_label, subject,
        message, status, platforms, send_window_label, next_step_checklist, sent_at, completed_at, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12::jsonb,$13,$14,$15::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        booking_id = excluded.booking_id,
        guest_name = excluded.guest_name,
        guest_email = excluded.guest_email,
        booking_label = excluded.booking_label,
        subject = excluded.subject,
        message = excluded.message,
        status = excluded.status,
        platforms = excluded.platforms,
        send_window_label = excluded.send_window_label,
        next_step_checklist = excluded.next_step_checklist,
        sent_at = excluded.sent_at,
        completed_at = excluded.completed_at,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.bookingId,
      record.guestName,
      record.guestEmail,
      record.bookingLabel,
      record.subject,
      record.message,
      record.status,
      JSON.stringify(record.platforms),
      record.sendWindowLabel,
      JSON.stringify(record.nextStepChecklist),
      record.sentAt,
      record.completedAt,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildRepeatCustomerCampaignUpsert = (campaign = {}) => {
  const record = buildRepeatCustomerCampaignRecord(campaign);

  return {
    text: `
      insert into public.repeat_customer_campaign_records (
        source_id, tenant_id, booking_id, guest_name, guest_email, booking_label, campaign_type,
        audience_tag, segment, channel, offer_label, subject, message, status,
        recommended_send_at_label, next_step_checklist, sent_at, converted_at, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17,$18,$19::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        booking_id = excluded.booking_id,
        guest_name = excluded.guest_name,
        guest_email = excluded.guest_email,
        booking_label = excluded.booking_label,
        campaign_type = excluded.campaign_type,
        audience_tag = excluded.audience_tag,
        segment = excluded.segment,
        channel = excluded.channel,
        offer_label = excluded.offer_label,
        subject = excluded.subject,
        message = excluded.message,
        status = excluded.status,
        recommended_send_at_label = excluded.recommended_send_at_label,
        next_step_checklist = excluded.next_step_checklist,
        sent_at = excluded.sent_at,
        converted_at = excluded.converted_at,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.bookingId,
      record.guestName,
      record.guestEmail,
      record.bookingLabel,
      record.campaignType,
      record.audienceTag,
      record.segment,
      record.channel,
      record.offerLabel,
      record.subject,
      record.message,
      record.status,
      record.recommendedSendAtLabel,
      JSON.stringify(record.nextStepChecklist),
      record.sentAt,
      record.convertedAt,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildReviewRequestDelete = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    delete from public.review_request_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildRepeatCustomerCampaignDelete = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    delete from public.repeat_customer_campaign_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const syncReviewRequestRecord = (reviewRequest, env) =>
  upsertRecord(buildReviewRequestUpsert(reviewRequest), env);

export const syncRepeatCustomerCampaignRecord = (campaign, env) =>
  upsertRecord(buildRepeatCustomerCampaignUpsert(campaign), env);

export const deleteReviewRequestRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildReviewRequestDelete({ sourceId, tenantId }), env);

export const deleteRepeatCustomerCampaignRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildRepeatCustomerCampaignDelete({ sourceId, tenantId }), env);
