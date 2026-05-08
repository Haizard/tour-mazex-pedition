import express from "express";
import MarketplaceQuestion from "../models/MarketplaceQuestion.js";
import MarketplaceReview from "../models/MarketplaceReview.js";
import TourPackage from "../models/TourPackage.js";
import Tenant from "../models/Tenant.js";
import TravelerPhotoSubmission from "../models/TravelerPhotoSubmission.js";
import { buildMarketplaceReviewSummary } from "../utils/marketplaceReviewAggregation.js";

const router = express.Router();

const buildRegex = (value = "") => new RegExp(String(value).trim(), "i");

const buildDiscoverySort = (sort = "") => {
  if (sort === "price-asc") {
    return { price: 1, featured: -1, createdAt: -1 };
  }

  if (sort === "price-desc") {
    return { price: -1, featured: -1, createdAt: -1 };
  }

  if (sort === "newest") {
    return { createdAt: -1, featured: -1 };
  }

  return { featured: -1, createdAt: -1 };
};

const toDiscoveryCard = (tour = {}) => ({
  _id: String(tour._id || ""),
  title: tour.title || "",
  description: tour.description || "",
  image: tour.image || "",
  location: tour.location || "",
  duration: tour.duration || "",
  category: tour.category || "",
  price: Number(tour.price || 0),
  featured: tour.featured === true,
  operator: {
    id: tour.tenantId?._id ? String(tour.tenantId._id) : "",
    name: tour.tenantId?.name || "Verified Operator",
    slug: tour.tenantId?.slug || "",
  },
  tripAdvisorRating: tour.tripAdvisorRating ?? null,
  tripAdvisorReviewCount: tour.tripAdvisorReviewCount ?? null,
});

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

const toDiscoveryDetail = (tour = {}) => ({
  ...tour,
  operator: {
    id: tour.tenantId?._id ? String(tour.tenantId._id) : "",
    name: tour.tenantId?.name || "Verified Operator",
    slug: tour.tenantId?.slug || "",
    marketplaceSettings: tour.tenantId?.marketplaceSettings || null,
  },
});

const fetchMarketplaceSnapshot = async (tourId, options = {}) => {
  const [reviews, photoCount, questionCount] = await Promise.all([
    MarketplaceReview.find({
      tourId,
      visibilityState: "public",
      moderationStatus: "approved",
    }).lean(),
    TravelerPhotoSubmission.countDocuments({
      tourId,
      moderationStatus: "approved",
    }),
    MarketplaceQuestion.countDocuments({
      tourId,
      status: "approved",
    }),
  ]);

  const summary = buildMarketplaceReviewSummary(reviews, {
    includeInquiryFeedbackInRatings: options.includeInquiryFeedbackInRatings === true,
  });

  return {
    ...summary,
    photoCount,
    questionCount,
  };
};

const buildDiscoveryQuery = async ({ q, location, minPrice, maxPrice, category, operator, duration }) => {
  const query = { isMarketplaceVisible: true };

  if (q) {
    const regex = buildRegex(q);
    query.$or = [
      { title: { $regex: regex } },
      { description: { $regex: regex } },
      { destinationsVisited: { $regex: regex } },
    ];
  }

  if (location) {
    query.location = { $regex: buildRegex(location) };
  }

  if (category) {
    query.category = { $regex: buildRegex(category) };
  }

  if (duration) {
    query.duration = { $regex: buildRegex(duration) };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (operator) {
    const operatorRegex = buildRegex(operator);
    const matchedOperators = await Tenant.find({
      $or: [
        { slug: { $regex: operatorRegex } },
        { name: { $regex: operatorRegex } },
      ],
    })
      .select("_id")
      .lean();

    const tenantIds = matchedOperators.map((tenant) => tenant._id);

    if (!tenantIds.length) {
      query.tenantId = { $in: [] };
    } else {
      query.tenantId = { $in: tenantIds };
    }
  }

  return query;
};

/**
 * GET /api/discovery/tours
 * Fetch global tours marked as marketplace visible.
 * Supports filtering, searching, sorting, and pagination.
 */
router.get("/tours", async (req, res) => {
  try {
    const {
      q,
      location,
      minPrice,
      maxPrice,
      category,
      operator,
      duration,
      sort,
      limit = 20,
      page = 1,
    } = req.query;

    const query = await buildDiscoveryQuery({
      q,
      location,
      minPrice,
      maxPrice,
      category,
      operator,
      duration,
    });

    const parsedLimit = Math.max(Number(limit) || 20, 1);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const tours = await TourPackage.find(query)
      .sort(buildDiscoverySort(sort))
      .populate("tenantId", "name slug")
      .skip(skip)
      .limit(parsedLimit)
      .lean();

    const total = await TourPackage.countDocuments(query);

    const toursWithMarketplace = await Promise.all(
      tours.map(async (tour) =>
        toDiscoveryCardWithEngagement(
          tour,
          await fetchMarketplaceSnapshot(tour._id)
        )
      )
    );

    res.status(200).json({
      tours: toursWithMarketplace,
      pagination: {
        total,
        page: parsedPage,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch discovery tours", error: error.message });
  }
});

/**
 * GET /api/discovery/tours/:id
 * Fetch a specific marketplace-visible tour by ID.
 */
router.get("/tours/:id", async (req, res) => {
  try {
    const tour = await TourPackage.findOne({
      _id: req.params.id,
      isMarketplaceVisible: true,
    })
      .populate("tenantId", "name slug marketplaceSettings")
      .lean();

    if (!tour) {
      return res.status(404).json({ message: "Tour not found in marketplace." });
    }

    const marketplace = await fetchMarketplaceSnapshot(tour._id);

    res.status(200).json({
      ...toDiscoveryDetail(tour),
      isMarketplaceVisible: tour.isMarketplaceVisible === true,
      marketplace,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tour details", error: error.message });
  }
});

/**
 * GET /api/discovery/operators
 * Fetch a list of active operators on the network.
 */
router.get("/operators", async (_req, res) => {
  try {
    const operators = await Tenant.find({ status: "active" }).select("name slug customDomains").lean();

    res.status(200).json(operators);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch operators", error: error.message });
  }
});

export default router;
