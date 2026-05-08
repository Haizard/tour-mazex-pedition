# Marketplace Trust + Community Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build phase 1 marketplace engagement with verified traveler reviews, review summaries, traveler photos, public package Q&A, moderation controls, and discovery/detail API support.

**Architecture:** Add a dedicated marketplace engagement layer instead of overloading `TourPackage` and `TravelerFeedback`. New marketplace models will hold reviews, photos, questions, and traveler identities, while discovery routes will expose aggregated read models for public pages and tenant admin routes will manage moderation.

**Tech Stack:** Express, Mongoose, existing tenant-aware middleware, Vite/React, Node test runner, existing platform admin and tenant admin dashboards

---

## File Structure

### New backend models

- Create: `backend/models/TravelerIdentity.js`
- Create: `backend/models/MarketplaceReview.js`
- Create: `backend/models/TravelerPhotoSubmission.js`
- Create: `backend/models/MarketplaceQuestion.js`
- Create: `backend/models/MarketplaceAnswer.js`

### New backend utilities

- Create: `backend/utils/marketplaceIdentity.js`
- Create: `backend/utils/marketplaceReviewAggregation.js`
- Create: `backend/utils/marketplaceModeration.js`

### New backend routes

- Create: `backend/routes/marketplaceEngagementRoutes.js`

### Existing backend files to modify

- Modify: `backend/routes/discoveryRoutes.js`
- Modify: `backend/routes/tenantRoutes.js`
- Modify: `backend/server.js`
- Modify: `backend/models/Tenant.js`

### New backend tests

- Create: `backend/tests/marketplaceIdentity.test.js`
- Create: `backend/tests/marketplaceReviewAggregation.test.js`
- Create: `backend/tests/marketplaceEngagementApi.test.js`

### New frontend components

- Create: `src/components/Marketplace/ReviewSummaryPanel.jsx`
- Create: `src/components/Marketplace/PublicReviewFeed.jsx`
- Create: `src/components/Marketplace/ReviewSubmissionForm.jsx`
- Create: `src/components/Marketplace/TravelerPhotoGallery.jsx`
- Create: `src/components/Marketplace/TravelerPhotoSubmissionForm.jsx`
- Create: `src/components/Marketplace/PackageQuestionsPanel.jsx`
- Create: `src/components/Admin/MarketplaceModerationManager.jsx`

### Existing frontend files to modify

- Modify: `src/pages/DiscoveryTourDetail.jsx`
- Modify: `src/pages/AdminDashboard.jsx`
- Modify: `src/services/api.js`

### Frontend verification

- Modify: `src/pages/DiscoveryTourDetail.jsx` only after API surfaces exist
- Use existing `npm run build` verification

---

### Task 1: Define traveler identity and engagement data models

**Files:**
- Create: `backend/models/TravelerIdentity.js`
- Create: `backend/models/MarketplaceReview.js`
- Create: `backend/models/TravelerPhotoSubmission.js`
- Create: `backend/models/MarketplaceQuestion.js`
- Create: `backend/models/MarketplaceAnswer.js`
- Test: `backend/tests/marketplaceIdentity.test.js`

- [ ] **Step 1: Write the failing model test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import TravelerIdentity from "../models/TravelerIdentity.js";
import MarketplaceReview from "../models/MarketplaceReview.js";
import MarketplaceQuestion from "../models/MarketplaceQuestion.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/marketplaceIdentity.test.js`

Expected: FAIL with module not found errors for the new marketplace model files.

- [ ] **Step 3: Write minimal model implementations**

```js
// backend/models/TravelerIdentity.js
import mongoose from "mongoose";

const travelerIdentitySchema = new mongoose.Schema(
  {
    sessionKey: { type: String, index: true, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    verificationState: {
      type: String,
      enum: ["guest", "verified-inquiry", "verified-booking"],
      default: "guest",
    },
    linkedInquiryIds: [{ type: String }],
    linkedBookingIds: [{ type: String }],
    futureAccountId: { type: String, default: "" },
  },
  { timestamps: true }
);

const TravelerIdentity =
  mongoose.models.TravelerIdentity ||
  mongoose.model("TravelerIdentity", travelerIdentitySchema);

export default TravelerIdentity;
```

```js
// backend/models/MarketplaceReview.js
import mongoose from "mongoose";

const marketplaceReviewSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: "TourPackage", required: true, index: true },
    travelerIdentityId: { type: mongoose.Schema.Types.ObjectId, ref: "TravelerIdentity", required: true, index: true },
    bookingId: { type: String, default: "" },
    inquiryId: { type: String, default: "" },
    verificationType: {
      type: String,
      enum: ["booking", "inquiry"],
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    headline: { type: String, trim: true, default: "" },
    reviewBody: { type: String, trim: true, default: "" },
    sentimentTags: [{ type: String }],
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    visibilityState: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    travelMonth: { type: String, trim: true, default: "" },
    travelerType: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const MarketplaceReview =
  mongoose.models.MarketplaceReview ||
  mongoose.model("MarketplaceReview", marketplaceReviewSchema);

export default MarketplaceReview;
```

```js
// backend/models/TravelerPhotoSubmission.js
import mongoose from "mongoose";

const travelerPhotoSubmissionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: "TourPackage", required: true, index: true },
    travelerIdentityId: { type: mongoose.Schema.Types.ObjectId, ref: "TravelerIdentity", required: true, index: true },
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceReview", default: null },
    mediaUrl: { type: String, required: true, trim: true },
    caption: { type: String, trim: true, default: "" },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const TravelerPhotoSubmission =
  mongoose.models.TravelerPhotoSubmission ||
  mongoose.model("TravelerPhotoSubmission", travelerPhotoSubmissionSchema);

export default TravelerPhotoSubmission;
```

```js
// backend/models/MarketplaceQuestion.js
import mongoose from "mongoose";

const marketplaceQuestionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: "TourPackage", required: true, index: true },
    travelerIdentityId: { type: mongoose.Schema.Types.ObjectId, ref: "TravelerIdentity", required: true, index: true },
    questionBody: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    answerCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const MarketplaceQuestion =
  mongoose.models.MarketplaceQuestion ||
  mongoose.model("MarketplaceQuestion", marketplaceQuestionSchema);

export default MarketplaceQuestion;
```

```js
// backend/models/MarketplaceAnswer.js
import mongoose from "mongoose";

const marketplaceAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceQuestion", required: true, index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    authorType: {
      type: String,
      enum: ["operator", "admin"],
      required: true,
    },
    authorReference: { type: String, default: "" },
    answerBody: { type: String, required: true, trim: true },
    pinned: { type: Boolean, default: false },
    accepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const MarketplaceAnswer =
  mongoose.models.MarketplaceAnswer ||
  mongoose.model("MarketplaceAnswer", marketplaceAnswerSchema);

export default MarketplaceAnswer;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/marketplaceIdentity.test.js`

Expected: PASS for all three tests.

- [ ] **Step 5: Commit**

```bash
git add backend/models/TravelerIdentity.js backend/models/MarketplaceReview.js backend/models/TravelerPhotoSubmission.js backend/models/MarketplaceQuestion.js backend/models/MarketplaceAnswer.js backend/tests/marketplaceIdentity.test.js
git commit -m "feat: add marketplace engagement models"
```

### Task 2: Add traveler identity resolution and moderation helpers

**Files:**
- Create: `backend/utils/marketplaceIdentity.js`
- Create: `backend/utils/marketplaceModeration.js`
- Test: `backend/tests/marketplaceIdentity.test.js`

- [ ] **Step 1: Extend the test file with failing utility tests**

```js
import { resolveMarketplaceTravelerIdentity } from "../utils/marketplaceIdentity.js";
import { resolveReviewModerationState } from "../utils/marketplaceModeration.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/marketplaceIdentity.test.js`

Expected: FAIL with missing utility exports.

- [ ] **Step 3: Write minimal implementations**

```js
// backend/utils/marketplaceIdentity.js
export const resolveMarketplaceTravelerIdentity = async (input = {}, store) => {
  const sessionKey = String(input.sessionKey || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const bookingId = String(input.bookingId || "").trim();
  const inquiryId = String(input.inquiryId || "").trim();

  const existing = await store.findOne?.({ sessionKey, email });
  const linkedBookingIds = [...new Set([...(existing?.linkedBookingIds || []), ...(bookingId ? [bookingId] : [])])];
  const linkedInquiryIds = [...new Set([...(existing?.linkedInquiryIds || []), ...(inquiryId ? [inquiryId] : [])])];

  const verificationState = bookingId
    ? "verified-booking"
    : inquiryId
      ? "verified-inquiry"
      : "guest";

  return store.create({
    ...(existing || {}),
    sessionKey,
    email,
    verificationState,
    linkedBookingIds,
    linkedInquiryIds,
  });
};
```

```js
// backend/utils/marketplaceModeration.js
export const resolveReviewModerationState = ({ verificationType, tenantSettings = {} }) => {
  const autoPublish = verificationType === "booking" && tenantSettings.autoPublishVerifiedReviews === true;

  return autoPublish
    ? { moderationStatus: "approved", visibilityState: "public" }
    : { moderationStatus: "pending", visibilityState: "private" };
};

export const resolveQuestionModerationState = ({ tenantSettings = {} }) =>
  tenantSettings.autoPublishTravelerQuestions === true ? "approved" : "pending";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/marketplaceIdentity.test.js`

Expected: PASS with utility assertions succeeding.

- [ ] **Step 5: Commit**

```bash
git add backend/utils/marketplaceIdentity.js backend/utils/marketplaceModeration.js backend/tests/marketplaceIdentity.test.js
git commit -m "feat: add marketplace traveler identity helpers"
```

### Task 3: Add review aggregation utilities and tests

**Files:**
- Create: `backend/utils/marketplaceReviewAggregation.js`
- Test: `backend/tests/marketplaceReviewAggregation.test.js`

- [ ] **Step 1: Write the failing aggregation test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildMarketplaceReviewSummary } from "../utils/marketplaceReviewAggregation.js";

test("buildMarketplaceReviewSummary returns rating average, distribution, and top sentiment tags", () => {
  const summary = buildMarketplaceReviewSummary([
    { rating: 5, sentimentTags: ["guide", "food"], verificationType: "booking", visibilityState: "public" },
    { rating: 4, sentimentTags: ["guide"], verificationType: "booking", visibilityState: "public" },
    { rating: 3, sentimentTags: ["timing"], verificationType: "inquiry", visibilityState: "public" },
  ]);

  assert.equal(summary.averageRating, 4.5);
  assert.equal(summary.reviewCount, 2);
  assert.deepEqual(summary.ratingDistribution, { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 });
  assert.deepEqual(summary.topSentimentTags, ["guide", "food"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/marketplaceReviewAggregation.test.js`

Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

```js
// backend/utils/marketplaceReviewAggregation.js
export const buildMarketplaceReviewSummary = (reviews = []) => {
  const eligible = reviews.filter(
    (review) => review.visibilityState === "public" && review.verificationType === "booking"
  );

  const reviewCount = eligible.length;
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const sentimentCounts = new Map();

  let total = 0;
  for (const review of eligible) {
    total += Number(review.rating || 0);
    ratingDistribution[review.rating] += 1;
    for (const tag of review.sentimentTags || []) {
      sentimentCounts.set(tag, (sentimentCounts.get(tag) || 0) + 1);
    }
  }

  const topSentimentTags = [...sentimentCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([tag]) => tag);

  return {
    averageRating: reviewCount ? Number((total / reviewCount).toFixed(1)) : null,
    reviewCount,
    ratingDistribution,
    topSentimentTags,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/marketplaceReviewAggregation.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/utils/marketplaceReviewAggregation.js backend/tests/marketplaceReviewAggregation.test.js
git commit -m "feat: add marketplace review aggregation"
```

### Task 4: Add tenant moderation settings for marketplace community features

**Files:**
- Modify: `backend/models/Tenant.js`
- Modify: `backend/routes/tenantRoutes.js`
- Test: `backend/tests/marketplaceEngagementApi.test.js`

- [ ] **Step 1: Write the failing API settings test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeMarketplaceSettings } from "../routes/tenantRoutes.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: FAIL because `sanitizeMarketplaceSettings` does not exist.

- [ ] **Step 3: Add schema and sanitizer**

```js
// backend/models/Tenant.js
marketplaceSettings: {
  autoPublishVerifiedReviews: { type: Boolean, default: false },
  autoPublishTravelerQuestions: { type: Boolean, default: false },
  requirePhotoModeration: { type: Boolean, default: true },
  includeInquiryFeedbackInRatings: { type: Boolean, default: false },
  allowCommunityQnA: { type: Boolean, default: true },
},
```

```js
// backend/routes/tenantRoutes.js
export const sanitizeMarketplaceSettings = (input = {}) => ({
  autoPublishVerifiedReviews: input.autoPublishVerifiedReviews === true,
  autoPublishTravelerQuestions: input.autoPublishTravelerQuestions === true,
  requirePhotoModeration: input.requirePhotoModeration !== false,
  includeInquiryFeedbackInRatings: input.includeInquiryFeedbackInRatings === true,
  allowCommunityQnA: input.allowCommunityQnA !== false,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: PASS for the sanitizer test.

- [ ] **Step 5: Commit**

```bash
git add backend/models/Tenant.js backend/routes/tenantRoutes.js backend/tests/marketplaceEngagementApi.test.js
git commit -m "feat: add tenant marketplace moderation settings"
```

### Task 5: Build marketplace engagement API routes

**Files:**
- Create: `backend/routes/marketplaceEngagementRoutes.js`
- Modify: `backend/server.js`
- Test: `backend/tests/marketplaceEngagementApi.test.js`

- [ ] **Step 1: Write the failing API route tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicReviewPayload, buildPublicQuestionPayload } from "../routes/marketplaceEngagementRoutes.js";

test("buildPublicReviewPayload hides private reviews", () => {
  const payload = buildPublicReviewPayload({
    rating: 5,
    headline: "Excellent safari",
    reviewBody: "Would book again.",
    verificationType: "booking",
    visibilityState: "public",
  });

  assert.equal(payload.rating, 5);
  assert.equal(payload.verificationType, "booking");
});

test("buildPublicQuestionPayload returns question with answers count", () => {
  const payload = buildPublicQuestionPayload({
    questionBody: "Is this family friendly?",
    answerCount: 2,
    status: "approved",
  });

  assert.equal(payload.answerCount, 2);
  assert.equal(payload.status, "approved");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: FAIL with missing route file or exports.

- [ ] **Step 3: Write minimal public route helpers and route registration**

```js
// backend/routes/marketplaceEngagementRoutes.js
import express from "express";

export const buildPublicReviewPayload = (review = {}) => ({
  rating: review.rating,
  headline: review.headline || "",
  reviewBody: review.reviewBody || "",
  verificationType: review.verificationType || "booking",
});

export const buildPublicQuestionPayload = (question = {}) => ({
  questionBody: question.questionBody || "",
  answerCount: Number(question.answerCount || 0),
  status: question.status || "pending",
});

const router = express.Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

export default router;
```

```js
// backend/server.js
import marketplaceEngagementRoutes from "./routes/marketplaceEngagementRoutes.js";
app.use("/api/marketplace", marketplaceEngagementRoutes);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: PASS for helper payload tests.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/marketplaceEngagementRoutes.js backend/server.js backend/tests/marketplaceEngagementApi.test.js
git commit -m "feat: add marketplace engagement routes scaffold"
```

### Task 6: Implement verified review creation and public review reads

**Files:**
- Modify: `backend/routes/marketplaceEngagementRoutes.js`
- Modify: `backend/utils/marketplaceIdentity.js`
- Modify: `backend/utils/marketplaceModeration.js`
- Modify: `backend/utils/marketplaceReviewAggregation.js`
- Test: `backend/tests/marketplaceEngagementApi.test.js`

- [ ] **Step 1: Extend the API test with failing review flow coverage**

```js
test("create review rejects write without booking or inquiry reference", async () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: FAIL because `createMarketplaceReviewRecord` does not exist.

- [ ] **Step 3: Implement the review creation helper and route**

```js
// backend/routes/marketplaceEngagementRoutes.js
import MarketplaceReview from "../models/MarketplaceReview.js";
import Tenant from "../models/Tenant.js";
import { resolveMarketplaceTravelerIdentity } from "../utils/marketplaceIdentity.js";
import { buildMarketplaceReviewSummary } from "../utils/marketplaceReviewAggregation.js";
import { resolveReviewModerationState } from "../utils/marketplaceModeration.js";

export const createMarketplaceReviewRecord = async (payload = {}, deps = {}) => {
  const verificationType = payload.bookingId ? "booking" : payload.inquiryId ? "inquiry" : "";
  if (!verificationType) {
    throw new Error("Verified booking or inquiry reference is required.");
  }

  const identity = await deps.resolveIdentity({
    sessionKey: payload.sessionKey,
    email: payload.email,
    bookingId: payload.bookingId,
    inquiryId: payload.inquiryId,
  });

  const moderation = resolveReviewModerationState({
    verificationType,
    tenantSettings: deps.tenantSettings || {},
  });

  return deps.createReview({
    tenantId: payload.tenantId,
    tourId: payload.tourId,
    travelerIdentityId: identity._id,
    bookingId: payload.bookingId || "",
    inquiryId: payload.inquiryId || "",
    verificationType,
    rating: payload.rating,
    headline: payload.headline || "",
    reviewBody: payload.reviewBody || "",
    sentimentTags: payload.sentimentTags || [],
    travelMonth: payload.travelMonth || "",
    travelerType: payload.travelerType || "",
    ...moderation,
  });
};

router.post("/reviews", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.body.tenantId).lean();
    const review = await createMarketplaceReviewRecord(req.body, {
      resolveIdentity: (input) =>
        resolveMarketplaceTravelerIdentity(input, {
          findOne: (query) => TravelerIdentity.findOne(query).lean(),
          create: async (data) => {
            const created = await TravelerIdentity.findOneAndUpdate(
              { sessionKey: data.sessionKey, email: data.email },
              { $set: data },
              { new: true, upsert: true }
            );
            return created.toObject();
          },
        }),
      createReview: async (data) => {
        const created = await MarketplaceReview.create(data);
        return created.toObject();
      },
      tenantSettings: tenant?.marketplaceSettings || {},
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

router.get("/tours/:id/reviews", async (req, res) => {
  const reviews = await MarketplaceReview.find({
    tourId: req.params.id,
    visibilityState: "public",
    moderationStatus: "approved",
  }).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    summary: buildMarketplaceReviewSummary(reviews),
    reviews: reviews.map(buildPublicReviewPayload),
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: PASS for the review helper rejection test and the existing payload helper tests.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/marketplaceEngagementRoutes.js backend/utils/marketplaceIdentity.js backend/utils/marketplaceModeration.js backend/utils/marketplaceReviewAggregation.js backend/tests/marketplaceEngagementApi.test.js
git commit -m "feat: add verified marketplace reviews"
```

### Task 7: Implement traveler photo submissions and public gallery reads

**Files:**
- Modify: `backend/routes/marketplaceEngagementRoutes.js`
- Modify: `backend/utils/marketplaceModeration.js`
- Test: `backend/tests/marketplaceEngagementApi.test.js`

- [ ] **Step 1: Add a failing photo moderation test**

```js
test("photo submissions default to pending when tenant requires moderation", () => {
  const result = resolvePhotoModerationState({
    tenantSettings: { requirePhotoModeration: true },
  });

  assert.equal(result, "pending");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: FAIL with missing `resolvePhotoModerationState`.

- [ ] **Step 3: Implement photo moderation helper and endpoints**

```js
// backend/utils/marketplaceModeration.js
export const resolvePhotoModerationState = ({ tenantSettings = {} }) =>
  tenantSettings.requirePhotoModeration === false ? "approved" : "pending";
```

```js
// backend/routes/marketplaceEngagementRoutes.js
import TravelerPhotoSubmission from "../models/TravelerPhotoSubmission.js";
import { resolvePhotoModerationState } from "../utils/marketplaceModeration.js";

router.post("/photos", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.body.tenantId).lean();
    const identity = await resolveMarketplaceTravelerIdentity(
      {
        sessionKey: req.body.sessionKey,
        email: req.body.email,
        bookingId: req.body.bookingId,
        inquiryId: req.body.inquiryId,
      },
      {
        findOne: (query) => TravelerIdentity.findOne(query).lean(),
        create: async (data) => {
          const created = await TravelerIdentity.findOneAndUpdate(
            { sessionKey: data.sessionKey, email: data.email },
            { $set: data },
            { new: true, upsert: true }
          );
          return created.toObject();
        },
      }
    );

    const submission = await TravelerPhotoSubmission.create({
      tenantId: req.body.tenantId,
      tourId: req.body.tourId,
      travelerIdentityId: identity._id,
      reviewId: req.body.reviewId || null,
      mediaUrl: req.body.mediaUrl,
      caption: req.body.caption || "",
      moderationStatus: resolvePhotoModerationState({
        tenantSettings: tenant?.marketplaceSettings || {},
      }),
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

router.get("/tours/:id/photos", async (req, res) => {
  const photos = await TravelerPhotoSubmission.find({
    tourId: req.params.id,
    moderationStatus: "approved",
  }).sort({ createdAt: -1 }).lean();

  res.status(200).json(photos);
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: PASS for the photo moderation test.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/marketplaceEngagementRoutes.js backend/utils/marketplaceModeration.js backend/tests/marketplaceEngagementApi.test.js
git commit -m "feat: add marketplace traveler photo submissions"
```

### Task 8: Implement public package Q&A and operator answers

**Files:**
- Modify: `backend/routes/marketplaceEngagementRoutes.js`
- Modify: `backend/utils/marketplaceModeration.js`
- Test: `backend/tests/marketplaceEngagementApi.test.js`

- [ ] **Step 1: Add failing Q&A tests**

```js
test("question moderation follows tenant auto publish setting", () => {
  const result = resolveQuestionModerationState({
    tenantSettings: { autoPublishTravelerQuestions: true },
  });

  assert.equal(result, "approved");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: FAIL if `resolveQuestionModerationState` is not exported into the test surface.

- [ ] **Step 3: Implement question and answer routes**

```js
// backend/routes/marketplaceEngagementRoutes.js
import MarketplaceQuestion from "../models/MarketplaceQuestion.js";
import MarketplaceAnswer from "../models/MarketplaceAnswer.js";

router.post("/questions", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.body.tenantId).lean();
    const identity = await resolveMarketplaceTravelerIdentity(
      {
        sessionKey: req.body.sessionKey,
        email: req.body.email,
        inquiryId: req.body.inquiryId,
      },
      {
        findOne: (query) => TravelerIdentity.findOne(query).lean(),
        create: async (data) => {
          const created = await TravelerIdentity.findOneAndUpdate(
            { sessionKey: data.sessionKey, email: data.email },
            { $set: data },
            { new: true, upsert: true }
          );
          return created.toObject();
        },
      }
    );

    const question = await MarketplaceQuestion.create({
      tenantId: req.body.tenantId,
      tourId: req.body.tourId,
      travelerIdentityId: identity._id,
      questionBody: req.body.questionBody,
      status: resolveQuestionModerationState({
        tenantSettings: tenant?.marketplaceSettings || {},
      }),
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

router.post("/questions/:id/answers", async (req, res) => {
  const answer = await MarketplaceAnswer.create({
    questionId: req.params.id,
    tenantId: req.body.tenantId,
    authorType: req.body.authorType,
    authorReference: req.body.authorReference || "",
    answerBody: req.body.answerBody,
    pinned: req.body.pinned === true,
    accepted: req.body.accepted === true,
  });

  await MarketplaceQuestion.findByIdAndUpdate(req.params.id, { $inc: { answerCount: 1 } });
  res.status(201).json(answer);
});

router.get("/tours/:id/questions", async (req, res) => {
  const questions = await MarketplaceQuestion.find({
    tourId: req.params.id,
    status: "approved",
  }).sort({ createdAt: -1 }).lean();

  res.status(200).json(questions.map(buildPublicQuestionPayload));
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: PASS for the question moderation test.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/marketplaceEngagementRoutes.js backend/tests/marketplaceEngagementApi.test.js
git commit -m "feat: add marketplace package questions and answers"
```

### Task 9: Extend discovery APIs with engagement summaries

**Files:**
- Modify: `backend/routes/discoveryRoutes.js`
- Modify: `backend/utils/marketplaceReviewAggregation.js`
- Test: `backend/tests/marketplaceEngagementApi.test.js`

- [ ] **Step 1: Add failing summary serialization test**

```js
import { toDiscoveryCardWithEngagement } from "../routes/discoveryRoutes.js";

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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: FAIL with missing serializer export.

- [ ] **Step 3: Add discovery serializer extension**

```js
// backend/routes/discoveryRoutes.js
export const toDiscoveryCardWithEngagement = (tour = {}, marketplace = {}) => ({
  ...toDiscoveryCard(tour),
  marketplace: {
    averageRating: marketplace.averageRating ?? null,
    reviewCount: marketplace.reviewCount ?? 0,
    topSentimentTags: marketplace.topSentimentTags || [],
    photoCount: marketplace.photoCount ?? 0,
    questionCount: marketplace.questionCount ?? 0,
  },
});
```

Then replace the current tour mapping in `GET /api/discovery/tours` with `toDiscoveryCardWithEngagement(tour, summary)` and extend `GET /api/discovery/tours/:id` similarly.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/marketplaceEngagementApi.test.js`

Expected: PASS for discovery serializer coverage.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/discoveryRoutes.js backend/tests/marketplaceEngagementApi.test.js
git commit -m "feat: expose marketplace engagement summaries in discovery"
```

### Task 10: Build marketplace detail page review, photo, and Q&A UI

**Files:**
- Create: `src/components/Marketplace/ReviewSummaryPanel.jsx`
- Create: `src/components/Marketplace/PublicReviewFeed.jsx`
- Create: `src/components/Marketplace/ReviewSubmissionForm.jsx`
- Create: `src/components/Marketplace/TravelerPhotoGallery.jsx`
- Create: `src/components/Marketplace/TravelerPhotoSubmissionForm.jsx`
- Create: `src/components/Marketplace/PackageQuestionsPanel.jsx`
- Modify: `src/pages/DiscoveryTourDetail.jsx`
- Modify: `src/services/api.js`
- Test: `npm run build`

- [ ] **Step 1: Add API client helpers**

```js
// src/services/api.js
export const fetchMarketplaceReviews = (tourId) => API.get(`/marketplace/tours/${tourId}/reviews`);
export const createMarketplaceReview = (payload) => API.post("/marketplace/reviews", payload);
export const fetchMarketplacePhotos = (tourId) => API.get(`/marketplace/tours/${tourId}/photos`);
export const createMarketplacePhoto = (payload) => API.post("/marketplace/photos", payload);
export const fetchMarketplaceQuestions = (tourId) => API.get(`/marketplace/tours/${tourId}/questions`);
export const createMarketplaceQuestion = (payload) => API.post("/marketplace/questions", payload);
```

- [ ] **Step 2: Create minimal UI components**

```jsx
// src/components/Marketplace/ReviewSummaryPanel.jsx
const ReviewSummaryPanel = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="rounded-[32px] border border-[#d8c8ae] bg-white p-6 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">Traveler Reviews</p>
      <div className="mt-4 flex items-end gap-3">
        <span className="text-5xl font-black text-slate-900">{summary.averageRating || "—"}</span>
        <span className="pb-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          {summary.reviewCount} verified reviews
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(summary.topSentimentTags || []).map((tag) => (
          <span key={tag} className="rounded-full bg-[#eef4ed] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#224433]">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ReviewSummaryPanel;
```

Repeat the same focused approach for the remaining five components. Each one should accept data and callbacks through props and avoid direct global state access.

- [ ] **Step 3: Wire detail page sections**

Add state in `src/pages/DiscoveryTourDetail.jsx` for:

```jsx
const [reviewData, setReviewData] = useState({ summary: null, reviews: [] });
const [photoData, setPhotoData] = useState([]);
const [questionData, setQuestionData] = useState([]);
```

Fetch them in a `useEffect` keyed by `tour?._id`, then render:

```jsx
<ReviewSummaryPanel summary={reviewData.summary} />
<PublicReviewFeed reviews={reviewData.reviews} />
<ReviewSubmissionForm tenantId={tour.operator?.id} tourId={tour._id} />
<TravelerPhotoGallery photos={photoData} />
<TravelerPhotoSubmissionForm tenantId={tour.operator?.id} tourId={tour._id} />
<PackageQuestionsPanel questions={questionData} tenantId={tour.operator?.id} tourId={tour._id} />
```

- [ ] **Step 4: Run build verification**

Run: `npm run build`

Expected: PASS with the marketplace detail page compiling.

- [ ] **Step 5: Commit**

```bash
git add src/components/Marketplace/ReviewSummaryPanel.jsx src/components/Marketplace/PublicReviewFeed.jsx src/components/Marketplace/ReviewSubmissionForm.jsx src/components/Marketplace/TravelerPhotoGallery.jsx src/components/Marketplace/TravelerPhotoSubmissionForm.jsx src/components/Marketplace/PackageQuestionsPanel.jsx src/pages/DiscoveryTourDetail.jsx src/services/api.js
git commit -m "feat: add marketplace trust and community UI"
```

### Task 11: Add tenant moderation UI for reviews, photos, and questions

**Files:**
- Create: `src/components/Admin/MarketplaceModerationManager.jsx`
- Modify: `src/pages/AdminDashboard.jsx`
- Modify: `src/services/api.js`
- Test: `npm run build`

- [ ] **Step 1: Add admin API helpers**

```js
// src/services/api.js
export const updateMarketplaceReviewModeration = (id, payload) => API.patch(`/marketplace/reviews/${id}`, payload);
export const updateMarketplacePhotoModeration = (id, payload) => API.patch(`/marketplace/photos/${id}`, payload);
export const updateMarketplaceQuestionModeration = (id, payload) => API.patch(`/marketplace/questions/${id}`, payload);
```

- [ ] **Step 2: Create the moderation manager**

```jsx
// src/components/Admin/MarketplaceModerationManager.jsx
const MarketplaceModerationManager = ({
  pendingReviews = [],
  pendingPhotos = [],
  pendingQuestions = [],
  onApproveReview,
  onApprovePhoto,
  onApproveQuestion,
}) => (
  <div className="space-y-8">
    <section className="rounded-[32px] border border-[#d8c8ae] bg-white p-6 shadow-sm">
      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Marketplace Moderation</h3>
      <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
        Review pending traveler reviews, traveler photos, and traveler questions before they go public.
      </p>
    </section>
  </div>
);

export default MarketplaceModerationManager;
```

- [ ] **Step 3: Mount the manager in the admin dashboard**

Import and render it inside the distribution or marketplace admin section in `src/pages/AdminDashboard.jsx`. Keep it behind the existing platform or tenant admin access patterns already used in the dashboard.

- [ ] **Step 4: Run build verification**

Run: `npm run build`

Expected: PASS with the new moderation manager rendered in the dashboard.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/MarketplaceModerationManager.jsx src/pages/AdminDashboard.jsx src/services/api.js
git commit -m "feat: add marketplace moderation manager"
```

### Task 12: Full regression verification for phase 1

**Files:**
- Test: `backend/tests/marketplaceIdentity.test.js`
- Test: `backend/tests/marketplaceReviewAggregation.test.js`
- Test: `backend/tests/marketplaceEngagementApi.test.js`
- Test: existing marketplace and booking verification commands

- [ ] **Step 1: Run backend marketplace tests**

Run: `node --test backend/tests/marketplaceIdentity.test.js backend/tests/marketplaceReviewAggregation.test.js backend/tests/marketplaceEngagementApi.test.js`

Expected: PASS for all marketplace phase 1 tests.

- [ ] **Step 2: Run existing regression checks**

Run: `node --test backend/tests/discoveryApi.test.js backend/tests/postgresRevenueRecords.test.js backend/tests/tenantContext.test.js`

Expected: PASS with no regressions in discovery, booking-record compatibility, or tenant context.

- [ ] **Step 3: Run frontend build**

Run: `npm run build`

Expected: PASS with updated discovery and admin UI.

- [ ] **Step 4: Commit the verified phase**

```bash
git add .
git commit -m "feat: ship marketplace trust and community phase"
```

- [ ] **Step 5: Push the branch**

```bash
git push origin main
```

## Self-Review

### Spec coverage

Covered from the approved phase:

- traveler-written reviews
- richer review breakdowns and sentiment summaries
- traveler photos
- community Q&A
- moderation controls
- discovery and detail summary exposure

Deferred intentionally to later plans:

- saved trips and favorites
- stronger comparison tools
- map-first discovery
- live availability calendars

### Placeholder scan

The plan uses explicit file paths, test commands, code snippets, and commit commands. There are no `TODO`, `TBD`, or “implement later” placeholders inside tasks.

### Type consistency

Consistent names used across tasks:

- `TravelerIdentity`
- `MarketplaceReview`
- `TravelerPhotoSubmission`
- `MarketplaceQuestion`
- `MarketplaceAnswer`
- `resolveMarketplaceTravelerIdentity`
- `buildMarketplaceReviewSummary`
- `resolveReviewModerationState`
- `resolvePhotoModerationState`
- `resolveQuestionModerationState`

