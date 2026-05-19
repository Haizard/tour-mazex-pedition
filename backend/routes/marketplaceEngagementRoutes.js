import express from "express";

import MarketplaceAnswer from "../models/MarketplaceAnswer.js";
import MarketplaceQuestion from "../models/MarketplaceQuestion.js";
import MarketplaceReview from "../models/MarketplaceReview.js";
import SavedTripList from "../models/SavedTripList.js";
import Tenant from "../models/Tenant.js";
import TourPackage from "../models/TourPackage.js";
import TripComparisonSet from "../models/TripComparisonSet.js";
import TravelerIdentity from "../models/TravelerIdentity.js";
import TravelerPhotoSubmission from "../models/TravelerPhotoSubmission.js";
import {
  buildAvailabilitySummary,
  computeAvailabilityEntries,
} from "../utils/marketplaceAvailability.js";
import {
  buildMarketplaceAvailabilityHealth,
  buildMarketplaceAvailabilityRows,
  buildMarketplaceAvailabilityWorkspace,
} from "../utils/marketplaceAvailabilityOperations.js";
import {
  buildReminderWatchStatesForTours,
  processMarketplaceReminderNotificationsNow,
  sendMarketplaceReminderEmail,
} from "../utils/marketplaceReminderNotifications.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { buildMarketplaceRegionSummaries } from "../utils/marketplaceRegionAggregation.js";
import { buildMarketplaceReviewSummary } from "../utils/marketplaceReviewAggregation.js";
import { resolveMarketplaceTravelerIdentity } from "../utils/marketplaceIdentity.js";
import {
  resolvePhotoModerationState,
  resolveQuestionModerationState,
  resolveReviewModerationState,
} from "../utils/marketplaceModeration.js";

const router = express.Router();
const AVAILABILITY_STATUSES = new Set(["available", "limited", "unavailable", "on-request"]);

const normalizeUniqueTourIds = (selectedTourIds = [], maxItems = 24) =>
  [...new Set((selectedTourIds || []).map((tourId) => String(tourId || "").trim()).filter(Boolean))].slice(
    0,
    maxItems
  );

const normalizeAvailabilityDateKey = (value = "") => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    throw new Error("A valid departure date is required.");
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
    .toISOString()
    .slice(0, 10);
};

export const normalizeMarketplaceAvailabilityEntry = (payload = {}, fallbackDateKey = "") => {
  const dateKey = normalizeAvailabilityDateKey(payload.date || fallbackDateKey);
  const status = String(payload.status || "available");
  if (!AVAILABILITY_STATUSES.has(status)) {
    throw new Error("A supported availability status is required.");
  }

  const remainingSpots =
    payload.remainingSpots === null || payload.remainingSpots === undefined || payload.remainingSpots === ""
      ? null
      : Math.max(Number(payload.remainingSpots || 0), 0);

  return {
    date: dateKey,
    status,
    published: payload.published !== false,
    remainingSpots: Number.isFinite(remainingSpots) ? remainingSpots : null,
    note: String(payload.note || "").trim(),
  };
};

const serializeMarketplaceAvailabilityEntries = (entries = []) =>
  (Array.isArray(entries) ? entries : [])
    .map((entry) => normalizeMarketplaceAvailabilityEntry(entry, entry?.date))
    .sort((left, right) => new Date(left.date) - new Date(right.date));

export const addMarketplaceAvailabilityEntry = (tour = {}, payload = {}) => {
  const nextEntry = normalizeMarketplaceAvailabilityEntry(payload);
  const nextEntries = serializeMarketplaceAvailabilityEntries([
    ...(tour.marketplaceAvailability || []).filter(
      (entry) => String(entry?.date || "").slice(0, 10) !== nextEntry.date
    ),
    nextEntry,
  ]);

  return {
    ...tour,
    marketplaceAvailability: nextEntries,
  };
};

export const updateMarketplaceAvailabilityEntry = (tour = {}, dateKey = "", patch = {}) => {
  const normalizedDateKey = normalizeAvailabilityDateKey(dateKey);
  let found = false;
  const nextEntries = serializeMarketplaceAvailabilityEntries(
    (tour.marketplaceAvailability || []).map((entry) => {
      if (String(entry?.date || "").slice(0, 10) !== normalizedDateKey) {
        return entry;
      }

      found = true;
      return normalizeMarketplaceAvailabilityEntry(
        {
          ...entry,
          ...patch,
        },
        normalizedDateKey
      );
    })
  );

  if (!found) {
    throw new Error("Departure entry not found.");
  }

  return {
    ...tour,
    marketplaceAvailability: nextEntries,
  };
};

export const deleteMarketplaceAvailabilityEntry = (tour = {}, dateKey = "") => {
  const normalizedDateKey = normalizeAvailabilityDateKey(dateKey);
  const nextEntries = (tour.marketplaceAvailability || []).filter(
    (entry) => String(entry?.date || "").slice(0, 10) !== normalizedDateKey
  );

  if (nextEntries.length === (tour.marketplaceAvailability || []).length) {
    throw new Error("Departure entry not found.");
  }

  return {
    ...tour,
    marketplaceAvailability: serializeMarketplaceAvailabilityEntries(nextEntries),
  };
};

export const applyBulkMarketplaceAvailabilityAction = (tour = {}, payload = {}) => {
  const dateKeys = [...new Set((payload.dateKeys || []).map((value) => normalizeAvailabilityDateKey(value)))];
  if (dateKeys.length === 0) {
    throw new Error("At least one departure date is required.");
  }

  const action = String(payload.action || "").trim();
  const nextEntries = serializeMarketplaceAvailabilityEntries(
    (tour.marketplaceAvailability || []).map((entry) => {
      const entryDateKey = String(entry?.date || "").slice(0, 10);
      if (!dateKeys.includes(entryDateKey)) {
        return entry;
      }

      if (action === "set-status") {
        return normalizeMarketplaceAvailabilityEntry(
          { ...entry, status: payload.status },
          entryDateKey
        );
      }

      if (action === "set-published") {
        return normalizeMarketplaceAvailabilityEntry(
          { ...entry, published: payload.published === true },
          entryDateKey
        );
      }

      if (action === "adjust-spots") {
        const currentSpots = Number(entry?.remainingSpots || 0);
        return normalizeMarketplaceAvailabilityEntry(
          {
            ...entry,
            remainingSpots: Math.max(currentSpots + Number(payload.delta || 0), 0),
          },
          entryDateKey
        );
      }

      if (action === "set-note") {
        return normalizeMarketplaceAvailabilityEntry(
          { ...entry, note: payload.note || "" },
          entryDateKey
        );
      }

      throw new Error("Unsupported bulk availability action.");
    })
  );

  return {
    ...tour,
    marketplaceAvailability: nextEntries,
  };
};

const buildMarketplaceSelectableTour = (tour = {}) => {
  const availability = buildAvailabilitySummary(tour);

  return {
    _id: String(tour._id || ""),
    title: tour.title || "",
    description: tour.description || "",
    image: tour.image || "",
    location: tour.location || "",
    duration: tour.duration || "",
    category: tour.category || "",
    price: Number(tour.price || 0),
    tourType: tour.tourType || "",
    destinationsVisited: tour.destinationsVisited || [],
    inclusions: (tour.inclusions || []).slice(0, 5),
    operator: {
      id: tour.tenantId?._id ? String(tour.tenantId._id) : "",
      name: tour.tenantId?.name || "Verified Operator",
      slug: tour.tenantId?.slug || "",
    },
    marketplaceAvailability: availability.entries.slice(0, 6).map((entry) => ({
      date: entry.date,
      status: entry.status,
      remainingSpots: entry.remainingSpots,
      note: entry.note || "",
      bookable: entry.bookable === true,
      instantBookable: entry.instantBookable === true,
    })),
    availabilitySummary: {
      hasPublishedDates: availability.hasPublishedDates,
      upcomingDatesCount: availability.upcomingDatesCount,
      nextBookableDate: availability.nextBookableDate,
      nextInstantBookableDate: availability.nextInstantBookableDate,
      requestOnly: availability.requestOnly,
      instantBookingEnabled: availability.instantBookingEnabled,
    },
    marketplace: {
      averageRating: tour.marketplace?.averageRating ?? null,
      reviewCount: tour.marketplace?.reviewCount ?? 0,
      topSentimentTags: tour.marketplace?.topSentimentTags || [],
    },
  };
};

const normalizeReminderPayload = (payload = {}) => ({
  enabled: payload.enabled === true,
  email: String(payload.email || "").trim().toLowerCase(),
  watchedTourIds: normalizeUniqueTourIds(payload.watchedTourIds, 24),
  notifyForNewDates: payload.notifyForNewDates !== false,
  notifyForUnavailableDates: payload.notifyForUnavailableDates !== false,
  lastRequestedAt: payload.enabled === true ? new Date() : null,
  lastConfirmationSentAt: payload.lastConfirmationSentAt || null,
  watchStates: payload.watchStates || [],
});

const attachMarketplaceSummaries = async (tours = []) => {
  const summaries = await Promise.all(
    tours.map(async (tour) => {
      const reviews = await MarketplaceReview.find({
        tourId: tour._id,
        visibilityState: "public",
        moderationStatus: "approved",
      }).lean();

      return [
        String(tour._id || ""),
        buildMarketplaceReviewSummary(reviews),
      ];
    })
  );

  const summaryMap = new Map(summaries);
  return tours.map((tour) => ({
    ...tour,
    marketplace: summaryMap.get(String(tour._id || "")) || null,
  }));
};

const findOrCreateTravelerIdentity = (input) =>
  resolveMarketplaceTravelerIdentity(input, {
    findOne: async (query) =>
      TravelerIdentity.findOne({
        $or: [
          ...(query.sessionKey ? [{ sessionKey: query.sessionKey }] : []),
          ...(query.email ? [{ email: query.email }] : []),
        ],
      }).lean(),
    create: async (data) => {
      const match = data._id
        ? { _id: data._id }
        : {
            ...(data.sessionKey ? { sessionKey: data.sessionKey } : {}),
            ...(data.email ? { email: data.email } : {}),
          };
      const created = await TravelerIdentity.findOneAndUpdate(
        Object.keys(match).length ? match : { _id: data._id || undefined },
        { $set: data },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      return created.toObject();
    },
  });

const loadTenantAndTour = async ({ tenantId, tourId }) => {
  const [tenant, tour] = await Promise.all([
    Tenant.findById(tenantId).lean(),
    TourPackage.findById(tourId)
      .select(
        "_id tenantId isMarketplaceVisible allowMarketplaceReviews allowTravelerPhotos allowMarketplaceQuestions"
      )
      .lean(),
  ]);

  if (!tenant) {
    throw new Error("Tenant not found.");
  }

  if (!tour || String(tour.tenantId || "") !== String(tenantId || "")) {
    throw new Error("Tour not found for the provided operator.");
  }

  return { tenant, tour };
};

const assertMarketplaceActionAllowed = (tour = {}, action = "", tenant = {}) => {
  if (tour.isMarketplaceVisible !== true) {
    throw new Error("This package is not currently available on the marketplace.");
  }

  if (action === "reviews" && tour.allowMarketplaceReviews === false) {
    throw new Error("Reviews are currently disabled for this package.");
  }

  if (action === "photos" && tour.allowTravelerPhotos === false) {
    throw new Error("Traveler photo sharing is currently disabled for this package.");
  }

  if (action === "questions") {
    if (tenant.marketplaceSettings?.allowCommunityQnA === false) {
      throw new Error("Community questions are disabled for this operator.");
    }

    if (tour.allowMarketplaceQuestions === false) {
      throw new Error("Public questions are currently disabled for this package.");
    }
  }
};

export const buildPublicReviewPayload = (review = {}) => ({
  id: String(review._id || ""),
  rating: Number(review.rating || 0),
  headline: review.headline || "",
  reviewBody: review.reviewBody || "",
  verificationType: review.verificationType || "booking",
  travelMonth: review.travelMonth || "",
  travelerType: review.travelerType || "",
  sentimentTags: review.sentimentTags || [],
  submittedAt: review.createdAt || null,
});

export const buildPublicQuestionPayload = (question = {}) => ({
  id: String(question._id || ""),
  questionBody: question.questionBody || "",
  answerCount: Number(question.answerCount || 0),
  status: question.status || "pending",
  answers: Array.isArray(question.answers)
    ? question.answers.map((answer) => ({
        id: String(answer._id || ""),
        answerBody: answer.answerBody || "",
        authorType: answer.authorType || "operator",
        pinned: answer.pinned === true,
        accepted: answer.accepted === true,
        createdAt: answer.createdAt || null,
      }))
    : [],
});

export const buildMarketplaceOperationsSnapshot = ({
  tours = [],
  reviews = [],
  photos = [],
  questions = [],
  savedTripLists = [],
} = {}) => {
  const normalizedTours = (tours || []).map((tour) => {
    const availability = buildAvailabilitySummary(tour);

    return {
      id: String(tour._id || ""),
      title: tour.title || "",
      location: tour.location || "",
      category: tour.category || "",
      isMarketplaceVisible: tour.isMarketplaceVisible === true,
      isPubliclyDistributable: tour.isPubliclyDistributable !== false,
      instantBookingEnabled: tour.marketplaceAvailabilitySettings?.instantBookingEnabled === true,
      nextPublishedDate: availability.nextPublishedDate || null,
      nextBookableDate: availability.nextBookableDate || null,
      upcomingDatesCount: availability.upcomingDatesCount || 0,
    };
  });

  const statsByTourId = new Map(
    normalizedTours.map((tour) => [
      tour.id,
      {
        reviewCount: 0,
        publicReviewCount: 0,
        pendingReviewCount: 0,
        photoCount: 0,
        publicPhotoCount: 0,
        pendingPhotoCount: 0,
        questionCount: 0,
        publicQuestionCount: 0,
        pendingQuestionCount: 0,
        savedTripCount: 0,
        reminderWatcherCount: 0,
      },
    ])
  );

  for (const review of reviews || []) {
    const key = String(review.tourId || "");
    const stats = statsByTourId.get(key);
    if (!stats) continue;
    stats.reviewCount += 1;
    if (review.visibilityState === "public" && review.moderationStatus === "approved") {
      stats.publicReviewCount += 1;
    }
    if (review.moderationStatus === "pending") {
      stats.pendingReviewCount += 1;
    }
  }

  for (const photo of photos || []) {
    const key = String(photo.tourId || "");
    const stats = statsByTourId.get(key);
    if (!stats) continue;
    stats.photoCount += 1;
    if (photo.moderationStatus === "approved") {
      stats.publicPhotoCount += 1;
    }
    if (photo.moderationStatus === "pending") {
      stats.pendingPhotoCount += 1;
    }
  }

  for (const question of questions || []) {
    const key = String(question.tourId || "");
    const stats = statsByTourId.get(key);
    if (!stats) continue;
    stats.questionCount += 1;
    if (question.status === "approved") {
      stats.publicQuestionCount += 1;
    }
    if (question.status === "pending") {
      stats.pendingQuestionCount += 1;
    }
  }

  for (const savedTripList of savedTripLists || []) {
    const selectedIds = new Set(
      (savedTripList.selectedTourIds || []).map((tourId) => String(tourId || "")).filter(Boolean)
    );
    const reminderIds = new Set(
      (savedTripList.reminders?.watchStates || [])
        .map((state) => String(state.tourId || ""))
        .filter(Boolean)
    );

    for (const tourId of selectedIds) {
      const stats = statsByTourId.get(tourId);
      if (stats) {
        stats.savedTripCount += 1;
      }
    }

    if (savedTripList.reminders?.enabled === true) {
      for (const tourId of reminderIds) {
        const stats = statsByTourId.get(tourId);
        if (stats) {
          stats.reminderWatcherCount += 1;
        }
      }
    }
  }

  const packages = normalizedTours
    .map((tour) => ({
      ...tour,
      ...(statsByTourId.get(tour.id) || {}),
    }))
    .sort((left, right) => {
      if (left.isMarketplaceVisible !== right.isMarketplaceVisible) {
        return left.isMarketplaceVisible ? -1 : 1;
      }
      return (
        (right.savedTripCount || 0) +
        (right.reviewCount || 0) +
        (right.questionCount || 0) -
        ((left.savedTripCount || 0) + (left.reviewCount || 0) + (left.questionCount || 0))
      );
    });

  return {
    totals: {
      packageCount: packages.length,
      liveCount: packages.filter((item) => item.isMarketplaceVisible).length,
      partnerReadyCount: packages.filter((item) => item.isPubliclyDistributable).length,
      instantReadyCount: packages.filter((item) => item.instantBookingEnabled).length,
      upcomingDepartureCount: packages.reduce((sum, item) => sum + Number(item.upcomingDatesCount || 0), 0),
      publicReviewCount: packages.reduce((sum, item) => sum + Number(item.publicReviewCount || 0), 0),
      pendingReviewCount: packages.reduce((sum, item) => sum + Number(item.pendingReviewCount || 0), 0),
      publicPhotoCount: packages.reduce((sum, item) => sum + Number(item.publicPhotoCount || 0), 0),
      pendingPhotoCount: packages.reduce((sum, item) => sum + Number(item.pendingPhotoCount || 0), 0),
      publicQuestionCount: packages.reduce((sum, item) => sum + Number(item.publicQuestionCount || 0), 0),
      pendingQuestionCount: packages.reduce((sum, item) => sum + Number(item.pendingQuestionCount || 0), 0),
      savedTripCount: packages.reduce((sum, item) => sum + Number(item.savedTripCount || 0), 0),
      reminderWatcherCount: packages.reduce((sum, item) => sum + Number(item.reminderWatcherCount || 0), 0),
    },
    packages,
  };
};

const buildModerationQueuePayload = ({
  reviews = [],
  photos = [],
  questions = [],
  answersByQuestionId = {},
} = {}) => ({
  reviews: reviews.map((review) => ({
    id: String(review._id || ""),
    tourId: String(review.tourId || ""),
    rating: Number(review.rating || 0),
    headline: review.headline || "",
    reviewBody: review.reviewBody || "",
    verificationType: review.verificationType || "booking",
    moderationStatus: review.moderationStatus || "pending",
    visibilityState: review.visibilityState || "private",
    travelMonth: review.travelMonth || "",
    travelerType: review.travelerType || "",
    sentimentTags: review.sentimentTags || [],
    bookingId: review.bookingId || "",
    inquiryId: review.inquiryId || "",
    createdAt: review.createdAt || null,
  })),
  photos: photos.map((photo) => ({
    id: String(photo._id || ""),
    tourId: String(photo.tourId || ""),
    reviewId: photo.reviewId ? String(photo.reviewId) : "",
    mediaUrl: photo.mediaUrl || "",
    caption: photo.caption || "",
    moderationStatus: photo.moderationStatus || "pending",
    createdAt: photo.createdAt || null,
  })),
  questions: questions.map((question) => ({
    id: String(question._id || ""),
    tourId: String(question.tourId || ""),
    questionBody: question.questionBody || "",
    status: question.status || "pending",
    answerCount: Number(question.answerCount || 0),
    createdAt: question.createdAt || null,
    answers: (answersByQuestionId[String(question._id || "")] || []).map((answer) => ({
      id: String(answer._id || ""),
      answerBody: answer.answerBody || "",
      authorType: answer.authorType || "operator",
      authorReference: answer.authorReference || "",
      pinned: answer.pinned === true,
      accepted: answer.accepted === true,
      createdAt: answer.createdAt || null,
    })),
  })),
});

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
    rating: Number(payload.rating || 0),
    headline: payload.headline || "",
    reviewBody: payload.reviewBody || "",
    sentimentTags: payload.sentimentTags || [],
    travelMonth: payload.travelMonth || "",
    travelerType: payload.travelerType || "",
    ...moderation,
  });
};

export const createSavedTripListRecord = async (payload = {}, deps = {}) => {
  const identity = await deps.resolveIdentity({
    sessionKey: payload.sessionKey,
    email: payload.email,
  });

  return deps.upsertList({
    travelerIdentityId: identity?._id || null,
    sessionKey: String(payload.sessionKey || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    selectedTourIds: normalizeUniqueTourIds(payload.selectedTourIds, 24),
    notes: String(payload.notes || "").trim(),
  });
};

export const createComparisonSetRecord = async (payload = {}, deps = {}) =>
  deps.upsertSet({
    sessionKey: String(payload.sessionKey || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    selectedTourIds: normalizeUniqueTourIds(payload.selectedTourIds, 4),
  });

export const buildSavedTripsPayload = ({ savedTripList = {}, tours = [] } = {}) => {
  const toursById = new Map(
    (tours || []).map((tour) => [String(tour._id || ""), buildMarketplaceSelectableTour(tour)])
  );
  const orderedTours = (savedTripList.selectedTourIds || [])
    .map((tourId) => toursById.get(String(tourId || "")))
    .filter(Boolean);

  return {
    count: orderedTours.length,
    updatedAt: savedTripList.updatedAt || null,
    notes: savedTripList.notes || "",
    reminders: savedTripList.reminders || null,
    tours: orderedTours,
  };
};

export const buildComparisonPayload = ({ comparisonSet = {}, tours = [] } = {}) => {
  const toursById = new Map(
    (tours || []).map((tour) => [String(tour._id || ""), buildMarketplaceSelectableTour(tour)])
  );
  const orderedTours = (comparisonSet.selectedTourIds || [])
    .map((tourId) => toursById.get(String(tourId || "")))
    .filter(Boolean);

  return {
    count: orderedTours.length,
    updatedAt: comparisonSet.updatedAt || null,
    tours: orderedTours,
  };
};

export const buildInstantBookingIntent = ({ tour = {}, travelDate = "", travelers = 1 } = {}) => {
  const entries = computeAvailabilityEntries(tour);
  const selected = entries.find((entry) => String(entry.date || "").startsWith(String(travelDate || "")));

  if (!selected) {
    throw new Error("Selected travel date is not published for this package.");
  }

  if (selected.instantBookable !== true) {
    throw new Error("This departure is not currently eligible for instant booking.");
  }

  return {
    tourId: String(tour._id || ""),
    travelDate: selected.date,
    travelers: Math.max(Number(travelers || 1), 1),
    status: "ready",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    remainingSpots: selected.remainingSpots,
    instantBookable: true,
  };
};

router.post("/reviews", async (req, res) => {
  try {
    const { tenant, tour } = await loadTenantAndTour({
      tenantId: req.body.tenantId,
      tourId: req.body.tourId,
    });
    assertMarketplaceActionAllowed(tour, "reviews", tenant);

    const review = await createMarketplaceReviewRecord(req.body, {
      resolveIdentity: findOrCreateTravelerIdentity,
      createReview: async (data) => {
        const created = await MarketplaceReview.create(data);
        return created.toObject();
      },
      tenantSettings: tenant.marketplaceSettings || {},
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

router.get("/tours/:id/reviews", async (req, res) => {
  try {
    const tenant = req.query.tenantId ? await Tenant.findById(req.query.tenantId).lean() : null;
    const reviews = await MarketplaceReview.find({
      tourId: req.params.id,
      visibilityState: "public",
      moderationStatus: "approved",
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      summary: buildMarketplaceReviewSummary(reviews, {
        includeInquiryFeedbackInRatings:
          tenant?.marketplaceSettings?.includeInquiryFeedbackInRatings === true,
      }),
      reviews: reviews.map(buildPublicReviewPayload),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/moderation", requireTenantAdmin, async (req, res) => {
  try {
    const [reviews, photos, questions] = await Promise.all([
      MarketplaceReview.find({ tenantId: req.tenantId })
        .sort({ moderationStatus: 1, createdAt: -1 })
        .limit(40)
        .lean(),
      TravelerPhotoSubmission.find({ tenantId: req.tenantId })
        .sort({ moderationStatus: 1, createdAt: -1 })
        .limit(40)
        .lean(),
      MarketplaceQuestion.find({ tenantId: req.tenantId })
        .sort({ status: 1, createdAt: -1 })
        .limit(40)
        .lean(),
    ]);

    const answers = await MarketplaceAnswer.find({
      questionId: { $in: questions.map((question) => question._id) },
      tenantId: req.tenantId,
    })
      .sort({ pinned: -1, createdAt: 1 })
      .lean();

    const answersByQuestionId = answers.reduce((accumulator, answer) => {
      const key = String(answer.questionId || "");
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(answer);
      return accumulator;
    }, {});

    res.status(200).json(
      buildModerationQueuePayload({
        reviews,
        photos,
        questions,
        answersByQuestionId,
      })
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/operations", requireTenantAdmin, async (req, res) => {
  try {
    const tours = await TourPackage.find({ tenantId: req.tenantId })
      .select(
        "_id title location category isMarketplaceVisible isPubliclyDistributable marketplaceAvailability marketplaceAvailabilitySettings"
      )
      .lean();

    const tourIds = tours.map((tour) => tour._id);

    const [reviews, photos, questions, savedTripLists] = await Promise.all([
      MarketplaceReview.find({ tenantId: req.tenantId }).select("tourId moderationStatus visibilityState").lean(),
      TravelerPhotoSubmission.find({ tenantId: req.tenantId }).select("tourId moderationStatus").lean(),
      MarketplaceQuestion.find({ tenantId: req.tenantId }).select("tourId status").lean(),
      tourIds.length > 0
        ? SavedTripList.find({
            $or: [
              { selectedTourIds: { $in: tourIds } },
              { "reminders.watchStates.tourId": { $in: tourIds } },
            ],
          })
            .select("selectedTourIds reminders")
            .lean()
        : Promise.resolve([]),
    ]);

    return res.json(
      buildMarketplaceOperationsSnapshot({
        tours,
        reviews,
        photos,
        questions,
        savedTripLists,
      })
    );
  } catch (error) {
    console.error("Marketplace operations error:", error);
    return res.status(500).json({ message: "Unable to load marketplace operations right now." });
  }
});

router.get("/availability", requireTenantAdmin, async (req, res) => {
  try {
    const tours = await TourPackage.find({ tenantId: req.tenantId })
      .select(
        "_id title location category isMarketplaceVisible isPubliclyDistributable marketplaceAvailability marketplaceAvailabilitySettings"
      )
      .lean();

    const tourIds = tours.map((tour) => tour._id);
    const savedTripLists =
      tourIds.length > 0
        ? await SavedTripList.find({
            $or: [
              { selectedTourIds: { $in: tourIds } },
              { "reminders.watchStates.tourId": { $in: tourIds } },
            ],
          })
            .select("selectedTourIds reminders")
            .lean()
        : [];

    const workspace = buildMarketplaceAvailabilityWorkspace({
      tours,
      savedTripLists,
    });

    return res.status(200).json(workspace);
  } catch (error) {
    console.error("Marketplace availability list error:", error);
    return res.status(500).json({ message: "Unable to load marketplace availability right now." });
  }
});

router.get("/availability/:tourId", requireTenantAdmin, async (req, res) => {
  try {
    const tour = await TourPackage.findOne({ _id: req.params.tourId, tenantId: req.tenantId })
      .select(
        "_id title location category isMarketplaceVisible marketplaceAvailability marketplaceAvailabilitySettings"
      )
      .lean();

    if (!tour) {
      return res.status(404).json({ message: "Marketplace package not found." });
    }

    return res.status(200).json({
      tour: {
        id: String(tour._id || ""),
        title: tour.title || "",
        location: tour.location || "",
        category: tour.category || "",
        isMarketplaceVisible: tour.isMarketplaceVisible === true,
      },
      entries: computeAvailabilityEntries(tour),
      summary: buildAvailabilitySummary(tour),
    });
  } catch (error) {
    console.error("Marketplace availability drawer error:", error);
    return res.status(500).json({ message: "Unable to load package availability right now." });
  }
});

router.post("/availability/:tourId/entries", requireTenantAdmin, async (req, res) => {
  try {
    const tour = await TourPackage.findOne({ _id: req.params.tourId, tenantId: req.tenantId })
      .select("_id marketplaceAvailability")
      .lean();

    if (!tour) {
      return res.status(404).json({ message: "Marketplace package not found." });
    }

    const next = addMarketplaceAvailabilityEntry(tour, req.body);
    await TourPackage.updateOne(
      { _id: req.params.tourId, tenantId: req.tenantId },
      { $set: { marketplaceAvailability: next.marketplaceAvailability } }
    );

    return res.status(201).json({ entries: next.marketplaceAvailability });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch("/availability/:tourId/entries/:dateKey", requireTenantAdmin, async (req, res) => {
  try {
    const tour = await TourPackage.findOne({ _id: req.params.tourId, tenantId: req.tenantId })
      .select("_id marketplaceAvailability")
      .lean();

    if (!tour) {
      return res.status(404).json({ message: "Marketplace package not found." });
    }

    const next = updateMarketplaceAvailabilityEntry(tour, req.params.dateKey, req.body);
    await TourPackage.updateOne(
      { _id: req.params.tourId, tenantId: req.tenantId },
      { $set: { marketplaceAvailability: next.marketplaceAvailability } }
    );

    return res.status(200).json({ entries: next.marketplaceAvailability });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/availability/:tourId/entries/:dateKey", requireTenantAdmin, async (req, res) => {
  try {
    const tour = await TourPackage.findOne({ _id: req.params.tourId, tenantId: req.tenantId })
      .select("_id marketplaceAvailability")
      .lean();

    if (!tour) {
      return res.status(404).json({ message: "Marketplace package not found." });
    }

    const next = deleteMarketplaceAvailabilityEntry(tour, req.params.dateKey);
    await TourPackage.updateOne(
      { _id: req.params.tourId, tenantId: req.tenantId },
      { $set: { marketplaceAvailability: next.marketplaceAvailability } }
    );

    return res.status(200).json({ entries: next.marketplaceAvailability });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/availability/:tourId/bulk", requireTenantAdmin, async (req, res) => {
  try {
    const tour = await TourPackage.findOne({ _id: req.params.tourId, tenantId: req.tenantId })
      .select("_id marketplaceAvailability")
      .lean();

    if (!tour) {
      return res.status(404).json({ message: "Marketplace package not found." });
    }

    const next = applyBulkMarketplaceAvailabilityAction(tour, req.body);
    await TourPackage.updateOne(
      { _id: req.params.tourId, tenantId: req.tenantId },
      { $set: { marketplaceAvailability: next.marketplaceAvailability } }
    );

    return res.status(200).json({ entries: next.marketplaceAvailability });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch("/reviews/:id", requireTenantAdmin, async (req, res) => {
  try {
    const update = {};
    if (typeof req.body.moderationStatus === "string") {
      update.moderationStatus = req.body.moderationStatus;
    }
    if (typeof req.body.visibilityState === "string") {
      update.visibilityState = req.body.visibilityState;
    }

    const review = await MarketplaceReview.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!review) {
      return res.status(404).json({ message: "Marketplace review not found." });
    }

    res.status(200).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/photos", async (req, res) => {
  try {
    const { tenant, tour } = await loadTenantAndTour({
      tenantId: req.body.tenantId,
      tourId: req.body.tourId,
    });
    assertMarketplaceActionAllowed(tour, "photos", tenant);
    const identity = await findOrCreateTravelerIdentity({
      sessionKey: req.body.sessionKey,
      email: req.body.email,
      bookingId: req.body.bookingId,
      inquiryId: req.body.inquiryId,
    });

    const submission = await TravelerPhotoSubmission.create({
      tenantId: req.body.tenantId,
      tourId: req.body.tourId,
      travelerIdentityId: identity._id,
      reviewId: req.body.reviewId || null,
      mediaUrl: req.body.mediaUrl,
      caption: req.body.caption || "",
      moderationStatus: resolvePhotoModerationState({
        tenantSettings: tenant.marketplaceSettings || {},
      }),
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

router.get("/tours/:id/photos", async (req, res) => {
  try {
    const photos = await TravelerPhotoSubmission.find({
      tourId: req.params.id,
      moderationStatus: "approved",
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/photos/:id", requireTenantAdmin, async (req, res) => {
  try {
    const submission = await TravelerPhotoSubmission.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { $set: { moderationStatus: req.body.moderationStatus } },
      { new: true, runValidators: true }
    ).lean();

    if (!submission) {
      return res.status(404).json({ message: "Traveler photo submission not found." });
    }

    res.status(200).json(submission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/questions", async (req, res) => {
  try {
    const { tenant, tour } = await loadTenantAndTour({
      tenantId: req.body.tenantId,
      tourId: req.body.tourId,
    });
    assertMarketplaceActionAllowed(tour, "questions", tenant);

    const identity = await findOrCreateTravelerIdentity({
      sessionKey: req.body.sessionKey,
      email: req.body.email,
      inquiryId: req.body.inquiryId,
    });

    const question = await MarketplaceQuestion.create({
      tenantId: req.body.tenantId,
      tourId: req.body.tourId,
      travelerIdentityId: identity._id,
      questionBody: req.body.questionBody,
      status: resolveQuestionModerationState({
        tenantSettings: tenant.marketplaceSettings || {},
      }),
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

router.post("/saved-trips", async (req, res) => {
  try {
    const savedTripList = await createSavedTripListRecord(req.body, {
      resolveIdentity: findOrCreateTravelerIdentity,
      upsertList: async (data) => {
        const match = data.travelerIdentityId
          ? { travelerIdentityId: data.travelerIdentityId }
          : { sessionKey: data.sessionKey || "__anonymous__", email: data.email || "" };
        const record = await SavedTripList.findOneAndUpdate(
          match,
          { $set: data },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();
        return record;
      },
    });

    const tours = await TourPackage.find({
      _id: { $in: savedTripList.selectedTourIds || [] },
      isMarketplaceVisible: true,
    })
      .populate("tenantId", "name slug")
      .lean();

    res.status(200).json(
      buildSavedTripsPayload({
        savedTripList,
        tours: await attachMarketplaceSummaries(tours),
      })
    );
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

router.get("/saved-trips", async (req, res) => {
  try {
    const sessionKey = String(req.query.sessionKey || "").trim();
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!sessionKey && !email) {
      return res.status(200).json({ count: 0, updatedAt: null, notes: "", tours: [] });
    }

    const savedTripList = await SavedTripList.findOne({
      $or: [
        ...(sessionKey ? [{ sessionKey }] : []),
        ...(email ? [{ email }] : []),
      ],
    }).lean();

    if (!savedTripList) {
      return res.status(200).json({ count: 0, updatedAt: null, notes: "", tours: [] });
    }

    const tours = await TourPackage.find({
      _id: { $in: savedTripList.selectedTourIds || [] },
      isMarketplaceVisible: true,
    })
      .populate("tenantId", "name slug")
      .lean();

    res.status(200).json(
      buildSavedTripsPayload({
        savedTripList,
        tours: await attachMarketplaceSummaries(tours),
      })
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/saved-trips/reminders", async (req, res) => {
  try {
    const sessionKey = String(req.body.sessionKey || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!sessionKey && !email) {
      throw new Error("Session key or email is required to manage marketplace reminders.");
    }

    const reminders = normalizeReminderPayload({
      ...req.body,
      email: req.body.email || email,
    });

    const match = {
      $or: [
        ...(sessionKey ? [{ sessionKey }] : []),
        ...(email ? [{ email }] : []),
      ],
    };

    const savedTripList = await SavedTripList.findOneAndUpdate(
      match,
      {
        $set: {
          sessionKey,
          email,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const tours = await TourPackage.find({
      _id: { $in: savedTripList.selectedTourIds || reminders.watchedTourIds || [] },
      isMarketplaceVisible: true,
    })
      .populate("tenantId", "name slug")
      .lean();

    savedTripList.reminders = {
      ...savedTripList.reminders?.toObject?.(),
      ...reminders,
      watchStates: reminders.enabled ? buildReminderWatchStatesForTours(tours) : [],
      lastConfirmationSentAt: reminders.enabled
        ? savedTripList.reminders?.lastConfirmationSentAt || null
        : null,
    };
    await savedTripList.save();

    let delivery = null;
    if (reminders.enabled && reminders.email) {
      try {
        delivery = await sendMarketplaceReminderEmail({
          to: reminders.email,
          events: tours.length
            ? tours.slice(0, 3).map((tour) => ({
                type: "watch-started",
                tour,
                nextState: buildAvailabilitySummary(tour),
              }))
            : [],
        });
        if (delivery?.delivered) {
          await SavedTripList.updateOne(
            { _id: savedTripList._id },
            { $set: { "reminders.lastConfirmationSentAt": new Date() } }
          );
        }
      } catch (error) {
        delivery = {
          delivered: false,
          skipped: false,
          reason: error.message,
        };
      }
    }

    res.status(200).json(
      {
        ...buildSavedTripsPayload({
          savedTripList: savedTripList.toObject(),
          tours: await attachMarketplaceSummaries(tours),
        }),
        reminderDelivery: delivery,
      }
    );
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

router.post("/reminders/process", async (req, res) => {
  try {
    const expectedSecret = String(process.env.MARKETPLACE_REMINDER_CRON_SECRET || "").trim();
    const providedSecret = String(
      req.headers["x-marketplace-reminder-secret"] || req.body.secret || req.query.secret || ""
    ).trim();

    if (expectedSecret && expectedSecret !== providedSecret) {
      return res.status(403).json({ message: "Reminder processing secret is invalid." });
    }

    const summary = await processMarketplaceReminderNotificationsNow({
      env: process.env,
      limit: Math.max(Number(req.body.limit || req.query.limit || 25), 1),
    });

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/comparisons", async (req, res) => {
  try {
    const comparisonSet = await createComparisonSetRecord(req.body, {
      upsertSet: async (data) => {
        const match = {
          sessionKey: data.sessionKey || "__anonymous__",
          email: data.email || "",
        };
        const record = await TripComparisonSet.findOneAndUpdate(
          match,
          { $set: data },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();
        return record;
      },
    });

    const tours = await TourPackage.find({
      _id: { $in: comparisonSet.selectedTourIds || [] },
      isMarketplaceVisible: true,
    })
      .populate("tenantId", "name slug")
      .lean();

    res.status(200).json(
      buildComparisonPayload({
        comparisonSet,
        tours: await attachMarketplaceSummaries(tours),
      })
    );
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

router.get("/comparisons", async (req, res) => {
  try {
    const sessionKey = String(req.query.sessionKey || "").trim();
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!sessionKey && !email) {
      return res.status(200).json({ count: 0, updatedAt: null, tours: [] });
    }

    const comparisonSet = await TripComparisonSet.findOne({
      $or: [
        ...(sessionKey ? [{ sessionKey }] : []),
        ...(email ? [{ email }] : []),
      ],
    }).lean();

    if (!comparisonSet) {
      return res.status(200).json({ count: 0, updatedAt: null, tours: [] });
    }

    const tours = await TourPackage.find({
      _id: { $in: comparisonSet.selectedTourIds || [] },
      isMarketplaceVisible: true,
    })
      .populate("tenantId", "name slug")
      .lean();

    res.status(200).json(
      buildComparisonPayload({
        comparisonSet,
        tours: await attachMarketplaceSummaries(tours),
      })
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/map/regions", async (_req, res) => {
  try {
    const tours = await TourPackage.find({ isMarketplaceVisible: true })
      .populate("tenantId", "name slug")
      .select("_id title location destinationsVisited price tenantId")
      .lean();

    res.status(200).json({
      regions: buildMarketplaceRegionSummaries(tours),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/instant-booking-intents", async (req, res) => {
  try {
    const tour = await TourPackage.findOne({
      _id: req.body.tourId,
      isMarketplaceVisible: true,
    })
      .populate("tenantId", "name slug")
      .lean();

    if (!tour) {
      return res.status(404).json({ message: "Marketplace package not found." });
    }

    const intent = buildInstantBookingIntent({
      tour,
      travelDate: req.body.travelDate,
      travelers: req.body.travelers,
    });

    res.status(200).json(intent);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

router.post("/questions/:id/answers", requireTenantAdmin, async (req, res) => {
  try {
    const question = await MarketplaceQuestion.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).lean();
    if (!question) {
      return res.status(404).json({ message: "Marketplace question not found." });
    }

    const answer = await MarketplaceAnswer.create({
      questionId: req.params.id,
      tenantId: req.tenantId,
      authorType: req.body.authorType || "operator",
      authorReference: req.body.authorReference || "",
      answerBody: req.body.answerBody,
      pinned: req.body.pinned === true,
      accepted: req.body.accepted === true,
    });

    await MarketplaceQuestion.updateOne({ _id: req.params.id }, { $inc: { answerCount: 1 } });
    res.status(201).json(answer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/tours/:id/questions", async (req, res) => {
  try {
    const questions = await MarketplaceQuestion.find({
      tourId: req.params.id,
      status: "approved",
    })
      .sort({ createdAt: -1 })
      .lean();

    const answers = await MarketplaceAnswer.find({
      questionId: { $in: questions.map((question) => question._id) },
    })
      .sort({ pinned: -1, createdAt: 1 })
      .lean();

    const answersByQuestionId = answers.reduce((accumulator, answer) => {
      const key = String(answer.questionId || "");
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(answer);
      return accumulator;
    }, {});

    res.status(200).json(
      questions.map((question) =>
        buildPublicQuestionPayload({
          ...question,
          answers: answersByQuestionId[String(question._id || "")] || [],
        })
      )
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/questions/:id", requireTenantAdmin, async (req, res) => {
  try {
    const question = await MarketplaceQuestion.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { $set: { status: req.body.status } },
      { new: true, runValidators: true }
    ).lean();

    if (!question) {
      return res.status(404).json({ message: "Marketplace question not found." });
    }

    res.status(200).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
