import test from "node:test";
import assert from "node:assert/strict";

import TravelerIdentity from "../models/TravelerIdentity.js";
import MarketplaceReview from "../models/MarketplaceReview.js";
import MarketplaceQuestion from "../models/MarketplaceQuestion.js";
import { resolveMarketplaceTravelerIdentity } from "../utils/marketplaceIdentity.js";
import { resolveReviewModerationState } from "../utils/marketplaceModeration.js";

test("traveler identity normalizes email and stores linked source ids", () => {
  const identity = new TravelerIdentity({
    sessionKey: "sess_123",
    email: "Traveler@Example.com ",
    verificationState: "guest",
    linkedInquiryIds: ["inq1"],
    linkedBookingIds: ["book1"],
  });

  assert.equal(identity.email, "traveler@example.com");
  assert.deepEqual(identity.linkedInquiryIds, ["inq1"]);
  assert.deepEqual(identity.linkedBookingIds, ["book1"]);
});

test("marketplace review requires rating and verification type", () => {
  const review = new MarketplaceReview({
    tenantId: "507f1f77bcf86cd799439011",
    tourId: "507f1f77bcf86cd799439012",
    travelerIdentityId: "507f1f77bcf86cd799439013",
    verificationType: "booking",
    rating: 5,
    headline: "Excellent safari",
    reviewBody: "Everything was smooth and memorable.",
  });

  assert.equal(review.rating, 5);
  assert.equal(review.verificationType, "booking");
});

test("marketplace question stores public pending status by default", () => {
  const question = new MarketplaceQuestion({
    tenantId: "507f1f77bcf86cd799439011",
    tourId: "507f1f77bcf86cd799439012",
    travelerIdentityId: "507f1f77bcf86cd799439013",
    questionBody: "Is this route good in July?",
  });

  assert.equal(question.status, "pending");
  assert.equal(question.answerCount, 0);
});

test("resolveMarketplaceTravelerIdentity upgrades guest to verified booking when booking id exists", async () => {
  const store = {
    findOne: async () => null,
    create: async (payload) => payload,
  };

  const identity = await resolveMarketplaceTravelerIdentity(
    {
      sessionKey: "sess_123",
      email: "traveler@example.com",
      bookingId: "book_1",
      inquiryId: "",
    },
    store
  );

  assert.equal(identity.verificationState, "verified-booking");
  assert.deepEqual(identity.linkedBookingIds, ["book_1"]);
});

test("resolveMarketplaceTravelerIdentity preserves an existing identity id when new identifiers are added", async () => {
  const store = {
    findOne: async () => ({
      _id: "identity_1",
      sessionKey: "sess_old",
      email: "",
      linkedBookingIds: [],
      linkedInquiryIds: ["inq_1"],
    }),
    create: async (payload) => payload,
  };

  const identity = await resolveMarketplaceTravelerIdentity(
    {
      sessionKey: "sess_new",
      email: "traveler@example.com",
      inquiryId: "inq_1",
    },
    store
  );

  assert.equal(identity._id, "identity_1");
  assert.equal(identity.email, "traveler@example.com");
});

test("resolveReviewModerationState respects tenant auto publish for booking reviews", () => {
  const result = resolveReviewModerationState({
    verificationType: "booking",
    tenantSettings: { autoPublishVerifiedReviews: true },
  });

  assert.deepEqual(result, {
    moderationStatus: "approved",
    visibilityState: "public",
  });
});
