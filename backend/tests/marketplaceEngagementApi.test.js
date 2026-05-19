import test from "node:test";
import assert from "node:assert/strict";

import { toDiscoveryCardWithEngagement } from "../routes/discoveryRoutes.js";
import {
  buildMarketplaceOperationsSnapshot,
  buildPublicQuestionPayload,
  buildPublicReviewPayload,
  createMarketplaceReviewRecord,
} from "../routes/marketplaceEngagementRoutes.js";
import { sanitizeMarketplaceSettings } from "../routes/tenantRoutes.js";
import {
  resolvePhotoModerationState,
  resolveQuestionModerationState,
} from "../utils/marketplaceModeration.js";

test("sanitizeMarketplaceSettings keeps community moderation toggles", () => {
  const result = sanitizeMarketplaceSettings({
    autoPublishVerifiedReviews: true,
    autoPublishTravelerQuestions: false,
    requirePhotoModeration: true,
    includeInquiryFeedbackInRatings: false,
    allowCommunityQnA: true,
  });

  assert.equal(result.autoPublishVerifiedReviews, true);
  assert.equal(result.requirePhotoModeration, true);
  assert.equal(result.allowCommunityQnA, true);
});

test("buildPublicReviewPayload hides private implementation fields", () => {
  const payload = buildPublicReviewPayload({
    _id: "review1",
    rating: 5,
    headline: "Excellent safari",
    reviewBody: "Would book again.",
    verificationType: "booking",
    visibilityState: "public",
  });

  assert.equal(payload.id, "review1");
  assert.equal(payload.rating, 5);
  assert.equal(payload.verificationType, "booking");
});

test("buildPublicQuestionPayload returns question with answers count", () => {
  const payload = buildPublicQuestionPayload({
    _id: "question1",
    questionBody: "Is this family friendly?",
    answerCount: 2,
    status: "approved",
  });

  assert.equal(payload.id, "question1");
  assert.equal(payload.answerCount, 2);
  assert.equal(payload.status, "approved");
});

test("createMarketplaceReviewRecord rejects write without booking or inquiry reference", async () => {
  const result = await createMarketplaceReviewRecord(
    {
      tenantId: "507f1f77bcf86cd799439011",
      tourId: "507f1f77bcf86cd799439012",
      sessionKey: "sess_1",
      email: "traveler@example.com",
      rating: 5,
      headline: "Great trip",
      reviewBody: "Would book again.",
    },
    {
      resolveIdentity: async () => ({ _id: "identity1", verificationState: "guest" }),
      createReview: async () => ({ _id: "review1" }),
      tenantSettings: { autoPublishVerifiedReviews: true },
    }
  ).catch((error) => error.message);

  assert.equal(result, "Verified booking or inquiry reference is required.");
});

test("resolvePhotoModerationState honors tenant moderation setting", () => {
  assert.equal(
    resolvePhotoModerationState({
      tenantSettings: { requirePhotoModeration: true },
    }),
    "pending"
  );
  assert.equal(
    resolvePhotoModerationState({
      tenantSettings: { requirePhotoModeration: false },
    }),
    "approved"
  );
});

test("question moderation follows tenant auto publish setting", () => {
  const result = resolveQuestionModerationState({
    tenantSettings: { autoPublishTravelerQuestions: true },
  });

  assert.equal(result, "approved");
});

test("toDiscoveryCardWithEngagement attaches marketplace summary fields", () => {
  const payload = toDiscoveryCardWithEngagement(
    {
      _id: "tour1",
      title: "Safari",
      description: "Trip",
      image: "image.jpg",
      price: 1200,
      tenantId: { _id: "tenant1", name: "Operator", slug: "operator" },
    },
    {
      averageRating: 4.8,
      reviewCount: 18,
      topSentimentTags: ["guide", "lodges"],
      photoCount: 6,
      questionCount: 3,
    }
  );

  assert.equal(payload.marketplace.averageRating, 4.8);
  assert.equal(payload.marketplace.reviewCount, 18);
  assert.equal(payload.marketplace.photoCount, 6);
});

test("buildMarketplaceOperationsSnapshot summarizes engagement and reminders by package", () => {
  const snapshot = buildMarketplaceOperationsSnapshot({
    tours: [
      {
        _id: "tour1",
        title: "Migration Safari",
        location: "Serengeti",
        isMarketplaceVisible: true,
        isPubliclyDistributable: true,
        marketplaceAvailability: [{ date: "2026-06-10", status: "available", remainingSpots: 4 }],
        marketplaceAvailabilitySettings: { instantBookingEnabled: true },
      },
    ],
    reviews: [
      { tourId: "tour1", moderationStatus: "approved", visibilityState: "public" },
      { tourId: "tour1", moderationStatus: "pending", visibilityState: "private" },
    ],
    photos: [
      { tourId: "tour1", moderationStatus: "approved" },
      { tourId: "tour1", moderationStatus: "pending" },
    ],
    questions: [
      { tourId: "tour1", status: "approved" },
      { tourId: "tour1", status: "pending" },
    ],
    savedTripLists: [
      {
        selectedTourIds: ["tour1"],
        reminders: {
          enabled: true,
          watchStates: [{ tourId: "tour1" }],
        },
      },
    ],
    inquiries: [
      {
        _id: "inq1",
        campaignLabel: "tour_tour1",
        sourceChannel: "global-marketplace",
        leadStage: "qualified",
        status: "Contacted",
      },
      {
        _id: "inq2",
        campaignLabel: "tour_tour1",
        sourceChannel: "global-marketplace",
        leadStage: "booked",
        status: "Booked",
      },
    ],
  });

  assert.equal(snapshot.totals.liveCount, 1);
  assert.equal(snapshot.totals.publicReviewCount, 1);
  assert.equal(snapshot.totals.pendingPhotoCount, 1);
  assert.equal(snapshot.totals.publicQuestionCount, 1);
  assert.equal(snapshot.totals.savedTripCount, 1);
  assert.equal(snapshot.totals.reminderWatcherCount, 1);
  assert.equal(snapshot.totals.marketplaceInquiryCount, 2);
  assert.equal(snapshot.totals.marketplaceBookedCount, 1);
  assert.equal(snapshot.packages[0].instantBookingEnabled, true);
  assert.equal(snapshot.packages[0].marketplaceInquiryCount, 2);
  assert.equal(snapshot.packages[0].marketplaceBookedCount, 1);
});
