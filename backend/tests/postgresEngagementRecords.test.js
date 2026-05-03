import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLeadFollowUpSequenceLookup,
  buildLeadFollowUpSequenceView,
  buildTravelerFeedbackPublicTokenLookup,
  buildLeadFollowUpSequenceDelete,
  buildLeadFollowUpSequenceRecord,
  buildLeadFollowUpSequenceUpsert,
  buildPublicTravelerFeedbackView,
  buildTravelerFeedbackDelete,
  buildTravelerFeedbackRecord,
  buildTravelerFeedbackUpsert,
} from "../utils/postgresEngagementRecords.js";

test("buildTravelerFeedbackRecord normalizes feedback for postgres", () => {
  const record = buildTravelerFeedbackRecord({
    _id: "feedback-1",
    tenantId: "tenant-1",
    bookingId: "booking-1",
    rating: 5,
    privateNote: "Guide was amazing",
    publicReview: "Amazing safari",
    publicToken: "public-token",
    referralCode: "SR-123",
    status: "submitted",
    submittedAt: "2026-04-29T10:00:00.000Z",
    aiSentiment: "positive",
    aiScore: 0.98,
    aiSummary: "Very happy traveler",
    aiKeyTopics: ["guide", "lodges"],
    aiImprovementSuggestion: "Keep the same guide quality",
  });

  assert.equal(record.sourceId, "feedback-1");
  assert.equal(record.bookingId, "booking-1");
  assert.equal(record.publicToken, "public-token");
  assert.deepEqual(record.aiKeyTopics, ["guide", "lodges"]);
});

test("buildTravelerFeedbackUpsert produces stable SQL and values", () => {
  const statement = buildTravelerFeedbackUpsert({
    _id: "feedback-1",
    tenantId: "tenant-1",
    bookingId: "booking-1",
    publicToken: "public-token",
    aiKeyTopics: [],
  });

  assert.match(statement.text, /insert into public\.traveler_feedback_records/i);
  assert.equal(statement.values[0], "feedback-1");
  assert.equal(statement.values[2], "booking-1");
  assert.equal(statement.values[13], JSON.stringify([]));
});

test("buildTravelerFeedbackUpsert keeps non-null text defaults for optional AI fields", () => {
  const statement = buildTravelerFeedbackUpsert({
    _id: "feedback-2",
    tenantId: "tenant-1",
    bookingId: "booking-1",
    publicToken: "public-token-2",
  });

  assert.equal(statement.values[10], "");
  assert.equal(statement.values[12], "");
  assert.equal(statement.values[14], "");
});

test("buildTravelerFeedbackDelete targets one source and tenant pair", () => {
  const statement = buildTravelerFeedbackDelete({ sourceId: "feedback-1", tenantId: "tenant-1" });
  assert.match(statement.text, /delete from public\.traveler_feedback_records/i);
  assert.deepEqual(statement.values, ["feedback-1", "tenant-1"]);
});

test("buildTravelerFeedbackPublicTokenLookup targets the public token", () => {
  const statement = buildTravelerFeedbackPublicTokenLookup({ publicToken: "public-token" });
  assert.match(statement.text, /from public\.traveler_feedback_records/i);
  assert.match(statement.text, /where fr\.public_token = \$1/i);
  assert.deepEqual(statement.values, ["public-token"]);
});

test("buildPublicTravelerFeedbackView reconstructs the public feedback payload from postgres", () => {
  const feedback = buildPublicTravelerFeedbackView({
    source_id: "feedback-1",
    booking_id: "booking-1",
    booking_name: "Amina Musa",
    rating: 5,
    private_note: "Wonderful guide",
    public_review: "Amazing trip",
    public_token: "feedback-token-1",
    referral_code: "SR-123",
    status: "submitted",
    submitted_at: "2026-04-30T10:00:00.000Z",
  });

  assert.equal(feedback._id, "feedback-1");
  assert.equal(feedback.bookingId.name, "Amina Musa");
  assert.equal(feedback.rating, 5);
  assert.equal(feedback.publicToken, "feedback-token-1");
  assert.equal(feedback.submittedAt, "2026-04-30T10:00:00.000Z");
});

test("buildLeadFollowUpSequenceRecord normalizes follow-up sequence for postgres", () => {
  const record = buildLeadFollowUpSequenceRecord({
    _id: "sequence-1",
    tenantId: "tenant-1",
    inquiryId: "inquiry-1",
    bookingId: null,
    status: "active",
    touchpoints: [
      {
        scheduledAt: "2026-05-01T10:00:00.000Z",
        channel: "whatsapp",
        content: "Hello again",
        status: "pending",
        sentAt: null,
      },
    ],
  });

  assert.equal(record.sourceId, "sequence-1");
  assert.equal(record.inquiryId, "inquiry-1");
  assert.equal(record.touchpoints[0].channel, "whatsapp");
});

test("buildLeadFollowUpSequenceUpsert produces stable SQL and values", () => {
  const statement = buildLeadFollowUpSequenceUpsert({
    _id: "sequence-1",
    tenantId: "tenant-1",
    inquiryId: "inquiry-1",
    status: "active",
    touchpoints: [],
  });

  assert.match(statement.text, /insert into public\.lead_follow_up_sequence_records/i);
  assert.equal(statement.values[0], "sequence-1");
  assert.equal(statement.values[2], "inquiry-1");
  assert.equal(statement.values[5], JSON.stringify([]));
});

test("buildLeadFollowUpSequenceDelete targets one source and tenant pair", () => {
  const statement = buildLeadFollowUpSequenceDelete({ sourceId: "sequence-1", tenantId: "tenant-1" });
  assert.match(statement.text, /delete from public\.lead_follow_up_sequence_records/i);
  assert.deepEqual(statement.values, ["sequence-1", "tenant-1"]);
});

test("buildLeadFollowUpSequenceLookup targets one follow-up sequence", () => {
  const statement = buildLeadFollowUpSequenceLookup({ sourceId: "sequence-1", tenantId: "tenant-1" });
  assert.match(statement.text, /from public\.lead_follow_up_sequence_records/i);
  assert.match(statement.text, /where source_id = \$1 and tenant_id = \$2/i);
  assert.deepEqual(statement.values, ["sequence-1", "tenant-1"]);
});

test("buildLeadFollowUpSequenceView reconstructs the admin follow-up payload", () => {
  const sequence = buildLeadFollowUpSequenceView({
    source_id: "sequence-1",
    tenant_id: "tenant-1",
    inquiry_id: "inquiry-1",
    booking_id: null,
    status: "active",
    touchpoints: [
      {
        channel: "whatsapp",
        status: "pending",
        scheduledAt: "2026-05-01T10:00:00.000Z",
      },
    ],
  });

  assert.equal(sequence._id, "sequence-1");
  assert.equal(sequence.inquiryId, "inquiry-1");
  assert.equal(sequence.status, "active");
  assert.equal(sequence.touchpoints[0].scheduledAt, "2026-05-01T10:00:00.000Z");
});
