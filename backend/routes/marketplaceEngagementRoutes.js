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

const normalizeUniqueTourIds = (selectedTourIds = [], maxItems = 24) =>
  [...new Set((selectedTourIds || []).map((tourId) => String(tourId || "").trim()).filter(Boolean))].slice(
    0,
    maxItems
  );

const buildMarketplaceSelectableTour = (tour = {}) => ({
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
  marketplace: {
    averageRating: tour.marketplace?.averageRating ?? null,
    reviewCount: tour.marketplace?.reviewCount ?? 0,
    topSentimentTags: tour.marketplace?.topSentimentTags || [],
  },
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
    TourPackage.findById(tourId).select("_id tenantId isMarketplaceVisible").lean(),
  ]);

  if (!tenant) {
    throw new Error("Tenant not found.");
  }

  if (!tour || String(tour.tenantId || "") !== String(tenantId || "")) {
    throw new Error("Tour not found for the provided operator.");
  }

  return { tenant, tour };
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

router.post("/reviews", async (req, res) => {
  try {
    const { tenant } = await loadTenantAndTour({
      tenantId: req.body.tenantId,
      tourId: req.body.tourId,
    });

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
    const { tenant } = await loadTenantAndTour({
      tenantId: req.body.tenantId,
      tourId: req.body.tourId,
    });
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
    const { tenant } = await loadTenantAndTour({
      tenantId: req.body.tenantId,
      tourId: req.body.tourId,
    });
    if (tenant.marketplaceSettings?.allowCommunityQnA === false) {
      return res.status(403).json({ message: "Community questions are disabled for this operator." });
    }

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
