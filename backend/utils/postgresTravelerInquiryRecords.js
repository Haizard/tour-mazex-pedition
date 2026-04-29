import { createPostgresClient } from "./postgresClient.js";

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL traveler writer is not configured.");
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
    throw new Error("PostgreSQL traveler writer is not configured.");
  }

  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

export const buildTravelerInquiryRecord = (inquiry = {}) => ({
  sourceId: String(inquiry._id || ""),
  tenantId: String(inquiry.tenantId || ""),
  travelerName: inquiry.name || `${inquiry.firstName || ""} ${inquiry.lastName || ""}`.trim(),
  firstName: inquiry.firstName || "",
  lastName: inquiry.lastName || "",
  email: inquiry.email || "",
  phone: inquiry.phone || "",
  destinations: Array.isArray(inquiry.destinations) ? inquiry.destinations : [],
  travelWhen: inquiry.travelWhen || "",
  tripLengthDays: Number(inquiry.tripLengthDays || 0),
  adults: Number(inquiry.adults || 0),
  childrenUnder5: Number(inquiry.childrenUnder5 || 0),
  children6To15: Number(inquiry.children6To15 || 0),
  budget: inquiry.budget || "",
  leadStage: inquiry.leadStage || "new",
  status: inquiry.status || "Pending",
  sourceChannel: inquiry.sourceChannel || "website",
  campaignLabel: inquiry.campaignLabel || "",
  referralCode: inquiry.referralCode || "",
  leadScore: Number(inquiry.leadScore || 0),
  leadTemperature: inquiry.leadTemperature || "cold",
  firstTouchAt: inquiry.firstTouchAt ? new Date(inquiry.firstTouchAt).toISOString() : null,
  convertedAt: inquiry.convertedAt ? new Date(inquiry.convertedAt).toISOString() : null,
  sourcePayload: inquiry,
});

export const buildTravelerInquiryUpsert = (inquiry = {}) => {
  const record = buildTravelerInquiryRecord(inquiry);

  return {
    text: `
      insert into public.traveler_inquiry_records (
        source_id, tenant_id, traveler_name, first_name, last_name, email, phone, destinations,
        travel_when, trip_length_days, adults, children_under_5, children_6_to_15, budget,
        lead_stage, status, source_channel, campaign_label, referral_code, lead_score,
        lead_temperature, first_touch_at, converted_at, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        traveler_name = excluded.traveler_name,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = excluded.email,
        phone = excluded.phone,
        destinations = excluded.destinations,
        travel_when = excluded.travel_when,
        trip_length_days = excluded.trip_length_days,
        adults = excluded.adults,
        children_under_5 = excluded.children_under_5,
        children_6_to_15 = excluded.children_6_to_15,
        budget = excluded.budget,
        lead_stage = excluded.lead_stage,
        status = excluded.status,
        source_channel = excluded.source_channel,
        campaign_label = excluded.campaign_label,
        referral_code = excluded.referral_code,
        lead_score = excluded.lead_score,
        lead_temperature = excluded.lead_temperature,
        first_touch_at = excluded.first_touch_at,
        converted_at = excluded.converted_at,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.travelerName,
      record.firstName,
      record.lastName,
      record.email,
      record.phone,
      JSON.stringify(record.destinations || []),
      record.travelWhen,
      record.tripLengthDays,
      record.adults,
      record.childrenUnder5,
      record.children6To15,
      record.budget,
      record.leadStage,
      record.status,
      record.sourceChannel,
      record.campaignLabel,
      record.referralCode,
      record.leadScore,
      record.leadTemperature,
      record.firstTouchAt,
      record.convertedAt,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildTravelerInquiryDelete = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    delete from public.traveler_inquiry_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const syncTravelerInquiryRecord = (inquiry, env) =>
  upsertRecord(buildTravelerInquiryUpsert(inquiry), env);

export const deleteTravelerInquiryRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildTravelerInquiryDelete({ sourceId, tenantId }), env);
