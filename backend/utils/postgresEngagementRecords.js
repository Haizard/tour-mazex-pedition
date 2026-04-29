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
      record.aiSentiment || null,
      record.aiScore,
      record.aiSummary,
      JSON.stringify(record.aiKeyTopics),
      record.aiImprovementSuggestion,
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

export const buildLeadFollowUpSequenceDelete = ({ sourceId = "", tenantId = "" } = {}) => ({
  text: `
    delete from public.lead_follow_up_sequence_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const syncTravelerFeedbackRecord = (feedback, env) =>
  upsertRecord(buildTravelerFeedbackUpsert(feedback), env);

export const syncLeadFollowUpSequenceRecord = (sequence, env) =>
  upsertRecord(buildLeadFollowUpSequenceUpsert(sequence), env);

export const deleteTravelerFeedbackRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildTravelerFeedbackDelete({ sourceId, tenantId }), env);

export const deleteLeadFollowUpSequenceRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildLeadFollowUpSequenceDelete({ sourceId, tenantId }), env);
