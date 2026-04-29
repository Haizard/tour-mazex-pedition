import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRepeatCustomerCampaignDelete,
  buildRepeatCustomerCampaignRecord,
  buildRepeatCustomerCampaignUpsert,
  buildReviewRequestDelete,
  buildReviewRequestRecord,
  buildReviewRequestUpsert,
} from "../utils/postgresBookingLifecycleRecords.js";

test("buildReviewRequestRecord normalizes review automation data for postgres", () => {
  const record = buildReviewRequestRecord({
    _id: "review-1",
    tenantId: "tenant-1",
    bookingId: "booking-1",
    guestName: "Amina Said",
    guestEmail: "Amina@Example.com",
    bookingLabel: "Migration Escape",
    subject: "We would love your review",
    message: "Please share your feedback",
    status: "scheduled",
    platforms: [{ channel: "google", label: "Google Reviews", reviewUrl: "https://google.example" }],
    sendWindowLabel: "3 days after trip",
    nextStepChecklist: ["Add links", "Send draft"],
    sentAt: "2026-04-28T10:00:00.000Z",
    completedAt: null,
  });

  assert.equal(record.sourceId, "review-1");
  assert.equal(record.tenantId, "tenant-1");
  assert.equal(record.bookingId, "booking-1");
  assert.equal(record.guestEmail, "Amina@Example.com");
  assert.equal(record.platforms[0].channel, "google");
  assert.deepEqual(record.nextStepChecklist, ["Add links", "Send draft"]);
  assert.equal(record.sentAt, "2026-04-28T10:00:00.000Z");
});

test("buildReviewRequestUpsert produces stable SQL and values", () => {
  const statement = buildReviewRequestUpsert({
    _id: "review-1",
    tenantId: "tenant-1",
    bookingId: "booking-1",
    guestName: "Amina Said",
    guestEmail: "amina@example.com",
    bookingLabel: "Migration Escape",
    subject: "Review us",
    message: "Please review",
    platforms: [],
    nextStepChecklist: [],
  });

  assert.match(statement.text, /insert into public\.review_request_records/i);
  assert.equal(statement.values[0], "review-1");
  assert.equal(statement.values[2], "booking-1");
  assert.equal(statement.values[9], JSON.stringify([]));
  assert.equal(statement.values[11], JSON.stringify([]));
});

test("buildReviewRequestDelete targets one source and tenant pair", () => {
  const statement = buildReviewRequestDelete({ sourceId: "review-1", tenantId: "tenant-1" });
  assert.match(statement.text, /delete from public\.review_request_records/i);
  assert.deepEqual(statement.values, ["review-1", "tenant-1"]);
});

test("buildRepeatCustomerCampaignRecord normalizes loyalty automation data for postgres", () => {
  const record = buildRepeatCustomerCampaignRecord({
    _id: "campaign-1",
    tenantId: "tenant-1",
    bookingId: "booking-1",
    guestName: "Amina Said",
    guestEmail: "amina@example.com",
    bookingLabel: "Migration Escape",
    campaignType: "anniversary",
    audienceTag: "vip",
    segment: "VIP",
    channel: "whatsapp",
    offerLabel: "VIP Loyalty Recognition",
    subject: "Exclusive VIP Invitation",
    message: "We would love to host you again",
    status: "sent",
    recommendedSendAtLabel: "post-trip",
    nextStepChecklist: ["Confirm channel"],
    sentAt: "2026-04-29T10:00:00.000Z",
    convertedAt: null,
  });

  assert.equal(record.sourceId, "campaign-1");
  assert.equal(record.campaignType, "anniversary");
  assert.equal(record.segment, "VIP");
  assert.equal(record.channel, "whatsapp");
  assert.deepEqual(record.nextStepChecklist, ["Confirm channel"]);
});

test("buildRepeatCustomerCampaignUpsert produces stable SQL and values", () => {
  const statement = buildRepeatCustomerCampaignUpsert({
    _id: "campaign-1",
    tenantId: "tenant-1",
    bookingId: "booking-1",
    guestName: "Amina Said",
    guestEmail: "amina@example.com",
    bookingLabel: "Migration Escape",
    campaignType: "referral",
    subject: "Share the magic",
    message: "Tell a friend",
    nextStepChecklist: [],
  });

  assert.match(statement.text, /insert into public\.repeat_customer_campaign_records/i);
  assert.equal(statement.values[0], "campaign-1");
  assert.equal(statement.values[2], "booking-1");
  assert.equal(statement.values[15], JSON.stringify([]));
});

test("buildRepeatCustomerCampaignDelete targets one source and tenant pair", () => {
  const statement = buildRepeatCustomerCampaignDelete({
    sourceId: "campaign-1",
    tenantId: "tenant-1",
  });
  assert.match(statement.text, /delete from public\.repeat_customer_campaign_records/i);
  assert.deepEqual(statement.values, ["campaign-1", "tenant-1"]);
});
