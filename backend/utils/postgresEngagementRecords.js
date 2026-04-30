import { createPostgresClient } from "./postgresClient.js";

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) {
    throw new Error("PostgreSQL engagement writer is not configured.");
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
    throw new Error("PostgreSQL engagement writer is not configured.");
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
    throw new Error("PostgreSQL engagement writer is not configured.");
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

export const buildTravelerFeedbackRecord = (feedback = {}) => ({
  sourceId: String(feedback._id || ""),
  tenantId: String(feedback.tenantId || ""),
  bookingId: String(feedback.bookingId || ""),
  rating:
    feedback.rating === null || feedback.rating === undefined ? null : Number(feedback.rating || 0),
  privateNote: feedback.privateNote || "",
  publicReview: feedback.publicReview || "",
  publicToken: feedback.publicToken || "",
  referralCode: feedback.referralCode || "",
  status: feedback.status || "pending",
  submittedAt: feedback.submittedAt ? new Date(feedback.submittedAt).toISOString() : null,
  aiSentiment: feedback.aiSentiment || "",
  aiScore:
    feedback.aiScore === null || feedback.aiScore === undefined ? null : Number(feedback.aiScore || 0),
  aiSummary: feedback.aiSummary || "",
  aiKeyTopics: Array.isArray(feedback.aiKeyTopics) ? feedback.aiKeyTopics : [],
  aiImprovementSuggestion: feedback.aiImprovementSuggestion || "",
  sourcePayload: feedback,
});

export const buildLeadFollowUpSequenceRecord = (sequence = {}) => ({
  sourceId: String(sequence._id || ""),
  tenantId: String(sequence.tenantId || ""),
  inquiryId: sequence.inquiryId ? String(sequence.inquiryId) : "",
  bookingId: sequence.bookingId ? String(sequence.bookingId) : "",
  status: sequence.status || "active",
  touchpoints: Array.isArray(sequence.touchpoints)
    ? sequence.touchpoints.map((touchpoint = {}) => ({
        ...touchpoint,
        scheduledAt: touchpoint.scheduledAt
          ? new Date(touchpoint.scheduledAt).toISOString()
          : null,
        sentAt: touchpoint.sentAt ? new Date(touchpoint.sentAt).toISOString() : null,
      }))
    : [],
  sourcePayload: sequence,
});

export const buildTravelerFeedbackUpsert = (feedback = {}) => {
  const record = buildTravelerFeedbackRecord(feedback);

  return {
    text: `
      insert into public.traveler_feedback_records (
        source_id, tenant_id, booking_id, rating, private_note, public_review, public_token,
        referral_code, status, submitted_at, ai_sentiment, ai_score, ai_summary, ai_key_topics,
        ai_improvement_suggestion, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        booking_id = excluded.booking_id,
        rating = excluded.rating,
        private_note = excluded.private_note,
        public_review = excluded.public_review,
        public_token = excluded.public_token,
        referral_code = excluded.referral_code,
        status = excluded.status,
        submitted_at = excluded.submitted_at,
        ai_sentiment = excluded.ai_sentiment,
        ai_score = excluded.ai_score,
        ai_summary = excluded.ai_summary,
        ai_key_topics = excluded.ai_key_topics,
        ai_improvement_suggestion = excluded.ai_improvement_suggestion,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.bookingId,
      record.rating,
      record.privateNote,
      record.publicReview,
      record.publicToken,
      record.referralCode,
      record.status,
      record.submittedAt,
      record.aiSentiment || "",
      record.aiScore,
      record.aiSummary || "",
      JSON.stringify(record.aiKeyTopics),
      record.aiImprovementSuggestion || "",
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildLeadFollowUpSequenceUpsert = (sequence = {}) => {
  const record = buildLeadFollowUpSequenceRecord(sequence);

  return {
    text: `
      insert into public.lead_follow_up_sequence_records (
        source_id, tenant_id, inquiry_id, booking_id, status, touchpoints, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        inquiry_id = excluded.inquiry_id,
        booking_id = excluded.booking_id,
        status = excluded.status,
        touchpoints = excluded.touchpoints,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.inquiryId || null,
      record.bookingId || null,
      record.status,
      JSON.stringify(record.touchpoints),
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildTravelerFeedbackDelete = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    delete from public.traveler_feedback_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildTravelerFeedbackPublicTokenLookup = ({ publicToken = "" } = {}) => ({
  text: `
    select
      fr.source_id,
      fr.tenant_id,
      fr.booking_id,
      fr.rating,
      fr.private_note,
      fr.public_review,
      fr.public_token,
      fr.referral_code,
      fr.status,
      fr.submitted_at,
      fr.ai_sentiment,
      fr.ai_score,
      fr.ai_summary,
      fr.ai_key_topics,
      fr.ai_improvement_suggestion,
      br.traveler_name as booking_name
    from public.traveler_feedback_records fr
    left join public.booking_records br
      on br.source_id = fr.booking_id and br.tenant_id = fr.tenant_id
    where fr.public_token = $1
    limit 1
  `,
  values: [String(publicToken || "")],
});

export const buildPublicTravelerFeedbackView = (row = {}) => ({
  _id: String(row.source_id || ""),
  bookingId: row.booking_id
    ? {
        _id: String(row.booking_id),
        name: String(row.booking_name || ""),
      }
    : null,
  rating: row.rating === null || row.rating === undefined ? null : Number(row.rating || 0),
  privateNote: String(row.private_note || ""),
  publicReview: String(row.public_review || ""),
  publicToken: String(row.public_token || ""),
  referralCode: String(row.referral_code || ""),
  status: String(row.status || "pending"),
  submittedAt: toIso(row.submitted_at),
  aiSentiment: String(row.ai_sentiment || ""),
  aiScore: row.ai_score === null || row.ai_score === undefined ? null : Number(row.ai_score || 0),
  aiSummary: String(row.ai_summary || ""),
  aiKeyTopics: Array.isArray(row.ai_key_topics) ? row.ai_key_topics : [],
  aiImprovementSuggestion: String(row.ai_improvement_suggestion || ""),
});

export const buildLeadFollowUpSequenceDelete = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    delete from public.lead_follow_up_sequence_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildLeadFollowUpSequenceLookup = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    select *
    from public.lead_follow_up_sequence_records
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildLeadFollowUpSequenceView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  inquiryId: row.inquiry_id ? String(row.inquiry_id) : null,
  bookingId: row.booking_id ? String(row.booking_id) : null,
  status: String(row.status || "active"),
  touchpoints: Array.isArray(row.touchpoints)
    ? row.touchpoints.map((touchpoint = {}) => ({
        ...touchpoint,
        scheduledAt: toIso(touchpoint.scheduledAt || touchpoint.scheduled_at),
        sentAt: toIso(touchpoint.sentAt || touchpoint.sent_at),
      }))
    : [],
});

export const syncTravelerFeedbackRecord = (feedback, env) =>
  upsertRecord(buildTravelerFeedbackUpsert(feedback), env);

export const syncLeadFollowUpSequenceRecord = (sequence, env) =>
  upsertRecord(buildLeadFollowUpSequenceUpsert(sequence), env);

export const deleteTravelerFeedbackRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildTravelerFeedbackDelete({ sourceId, tenantId }), env);

export const deleteLeadFollowUpSequenceRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildLeadFollowUpSequenceDelete({ sourceId, tenantId }), env);

export const findTravelerFeedbackByPublicToken = async (publicToken, env) =>
  querySingleRow(buildTravelerFeedbackPublicTokenLookup({ publicToken }), env);

export const findLeadFollowUpSequenceRecord = async (sourceId, tenantId, env) =>
  querySingleRow(buildLeadFollowUpSequenceLookup({ sourceId, tenantId }), env);
