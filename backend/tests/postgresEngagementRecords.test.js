import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLeadFollowUpSequenceDelete,
  buildLeadFollowUpSequenceRecord,
  buildLeadFollowUpSequenceUpsert,
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

test("buildTravelerFeedbackDelete targets one source and tenant pair", () => {
  const statement = buildTravelerFeedbackDelete({ sourceId: "feedback-1", tenantId: "tenant-1" });
  assert.match(statement.text, /delete from public\.traveler_feedback_records/i);
  assert.deepEqual(statement.values, ["feedback-1", "tenant-1"]);
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
