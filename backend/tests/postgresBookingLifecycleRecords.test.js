import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRepeatCustomerCampaignView,
  buildRepeatCustomerCampaignDelete,
  buildRepeatCustomerCampaignLookup,
  buildRepeatCustomerCampaignRecord,
  buildRepeatCustomerCampaignUpsert,
  buildReviewRequestLookup,
  buildReviewRequestView,
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

test("buildReviewRequestLookup targets one lifecycle record", () => {
  const statement = buildReviewRequestLookup({ sourceId: "review-1", tenantId: "tenant-1" });
  assert.match(statement.text, /from public\.review_request_records/i);
  assert.match(statement.text, /where source_id = \$1 and tenant_id = \$2/i);
  assert.deepEqual(statement.values, ["review-1", "tenant-1"]);
});

test("buildReviewRequestView reconstructs the admin review request payload", () => {
  const view = buildReviewRequestView({
    source_id: "review-1",
    tenant_id: "tenant-1",
    booking_id: "booking-1",
    guest_name: "Amina Said",
    guest_email: "amina@example.com",
    booking_label: "Migration Escape",
    subject: "Review us",
    message: "Please review",
    status: "sent",
    platforms: [{ channel: "google" }],
    send_window_label: "3 days after trip",
    next_step_checklist: ["Send"],
    sent_at: "2026-04-28T10:00:00.000Z",
  });

  assert.equal(view._id, "review-1");
  assert.equal(view.bookingId, "booking-1");
  assert.equal(view.guestName, "Amina Said");
  assert.equal(view.platforms[0].channel, "google");
  assert.equal(view.sentAt, "2026-04-28T10:00:00.000Z");
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

test("buildRepeatCustomerCampaignLookup targets one lifecycle record", () => {
  const statement = buildRepeatCustomerCampaignLookup({ sourceId: "campaign-1", tenantId: "tenant-1" });
  assert.match(statement.text, /from public\.repeat_customer_campaign_records/i);
  assert.match(statement.text, /where source_id = \$1 and tenant_id = \$2/i);
  assert.deepEqual(statement.values, ["campaign-1", "tenant-1"]);
});

test("buildRepeatCustomerCampaignView reconstructs the admin campaign payload", () => {
  const view = buildRepeatCustomerCampaignView({
    source_id: "campaign-1",
    tenant_id: "tenant-1",
    booking_id: "booking-1",
    guest_name: "Amina Said",
    guest_email: "amina@example.com",
    booking_label: "Migration Escape",
    campaign_type: "referral",
    audience_tag: "vip",
    segment: "VIP",
    channel: "whatsapp",
    offer_label: "VIP Loyalty Recognition",
    subject: "Share the magic",
    message: "Tell a friend",
    status: "sent",
    recommended_send_at_label: "post-trip",
    next_step_checklist: ["Confirm channel"],
    sent_at: "2026-04-29T10:00:00.000Z",
  });

  assert.equal(view._id, "campaign-1");
  assert.equal(view.bookingId, "booking-1");
  assert.equal(view.segment, "VIP");
  assert.equal(view.channel, "whatsapp");
  assert.equal(view.sentAt, "2026-04-29T10:00:00.000Z");
});
