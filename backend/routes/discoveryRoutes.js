import express from "express";
import Hotel from "../models/Hotel.js";
import MarketplaceQuestion from "../models/MarketplaceQuestion.js";
import MarketplaceReview from "../models/MarketplaceReview.js";
import Restaurant from "../models/Restaurant.js";
import TourPackage from "../models/TourPackage.js";
import Tenant from "../models/Tenant.js";
import TravelerPhotoSubmission from "../models/TravelerPhotoSubmission.js";
import { buildHospitalityRecommendations } from "../utils/hospitalityIntelligence.js";
import {
  buildAvailabilitySummary,
  matchesAvailabilityFilter,
  matchesDepartureMonth,
} from "../utils/marketplaceAvailability.js";
import { buildMarketplaceReviewSummary } from "../utils/marketplaceReviewAggregation.js";

const router = express.Router();

const buildRegex = (value = "") => new RegExp(String(value).trim(), "i");
const toTrimmedString = (value = "") => String(value || "").trim();
const toCommaList = (value = "") =>
  toTrimmedString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

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

const toDiscoveryCard = (tour = {}) => {
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
    featured: tour.featured === true,
    operator: {
      id: tour.tenantId?._id ? String(tour.tenantId._id) : "",
      name: tour.tenantId?.name || "Verified Operator",
      slug: tour.tenantId?.slug || "",
    },
    tripAdvisorRating: tour.tripAdvisorRating ?? null,
    tripAdvisorReviewCount: tour.tripAdvisorReviewCount ?? null,
    marketplaceAvailability: availability.entries.slice(0, 6).map((entry) => ({
      date: entry.date || null,
      status: entry.status || "available",
      remainingSpots: typeof entry.remainingSpots === "number" ? entry.remainingSpots : null,
      note: entry.note || "",
      bookable: entry.bookable === true,
      instantBookable: entry.instantBookable === true,
      source: entry.source || "manual",
    })),
    availabilitySummary: {
      entries: availability.entries.map((entry) => ({
        date: entry.date || null,
        status: entry.status || "available",
      })),
      hasPublishedDates: availability.hasPublishedDates,
      upcomingDatesCount: availability.upcomingDatesCount,
      availableCount: availability.availableCount,
      limitedCount: availability.limitedCount,
      instantBookableCount: availability.instantBookableCount,
      nextPublishedDate: availability.nextPublishedDate,
      nextUpcomingDate: availability.nextUpcomingDate,
      nextBookableDate: availability.nextBookableDate,
      nextInstantBookableDate: availability.nextInstantBookableDate,
      requestOnly: availability.requestOnly,
      instantBookingEnabled: availability.instantBookingEnabled,
    },
  };
};

const buildHospitalitySource = ({
  sourceType,
  sourceId,
  sourceSlug,
  destination,
  region,
  mealType,
  tripStyle,
  dietaryFits,
}) => ({
  type: sourceType || "marketplace",
  id: sourceId || sourceSlug || "",
  slug: sourceSlug || "",
  destination: destination || "",
  region: region || "",
  travelerContext: {
    mealType: mealType || "",
    tripStyle: tripStyle || "",
    dietaryFits,
  },
});

const toHospitalityHotelSource = (hotel = {}) => ({
  type: "hotel",
  id: String(hotel._id || ""),
  slug: hotel.slug || "",
  name: hotel.name || "",
  destination: hotel.destination || "",
  region: hotel.region || "",
});

const toHospitalityRestaurantSource = (restaurant = {}) => ({
  type: "restaurant",
  id: String(restaurant._id || ""),
  slug: restaurant.slug || "",
  name: restaurant.name || "",
  destination: restaurant.destination || "",
  region: restaurant.region || "",
});

const toHospitalityTourSource = (tour = {}) => ({
  type: "tour",
  id: String(tour._id || ""),
  name: tour.title || "",
  destination: tour.location || tour.destinationsVisited?.[0] || "",
  region: tour.region || tour.destinationSlug || "",
});

const resolveHospitalitySource = async (query = {}) => {
  const sourceType = toTrimmedString(query.sourceType).toLowerCase();
  const sourceId = toTrimmedString(query.sourceId);
  const sourceSlug = toTrimmedString(query.sourceSlug);
  const dietaryFits = toCommaList(query.dietaryFits);
  const fallbackSource = buildHospitalitySource({
    sourceType,
    sourceId,
    sourceSlug,
    destination: toTrimmedString(query.destination),
    region: toTrimmedString(query.region),
    mealType: toTrimmedString(query.mealType),
    tripStyle: toTrimmedString(query.tripStyle),
    dietaryFits,
  });

  let resolvedSource = null;

  if (sourceType === "hotel" && sourceSlug) {
    const hotel = await Hotel.findOne({
      slug: sourceSlug,
      published: true,
      marketplaceVisible: true,
    }).lean();
    if (hotel) resolvedSource = toHospitalityHotelSource(hotel);
  }

  if (sourceType === "restaurant" && sourceSlug) {
    const restaurant = await Restaurant.findOne({
      slug: sourceSlug,
      published: true,
      marketplaceVisible: true,
    }).lean();
    if (restaurant) resolvedSource = toHospitalityRestaurantSource(restaurant);
  }

  if (sourceType === "tour" && sourceId) {
    const tour = await TourPackage.findOne({
      _id: sourceId,
      isMarketplaceVisible: true,
    }).lean();
    if (tour) resolvedSource = toHospitalityTourSource(tour);
  }

  return {
    ...fallbackSource,
    ...(resolvedSource || {}),
    travelerContext: fallbackSource.travelerContext,
    destination: resolvedSource?.destination || fallbackSource.destination,
    region: resolvedSource?.region || fallbackSource.region,
  };
};

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

const toDiscoveryDetail = (tour = {}) => {
  const availability = buildAvailabilitySummary(tour);
  return {
    ...tour,
    marketplaceControls: {
      reviewsEnabled: tour.allowMarketplaceReviews !== false,
      travelerPhotosEnabled: tour.allowTravelerPhotos !== false,
      questionsEnabled:
        tour.allowMarketplaceQuestions !== false &&
        tour.tenantId?.marketplaceSettings?.allowCommunityQnA !== false,
    },
    operator: {
      id: tour.tenantId?._id ? String(tour.tenantId._id) : "",
      name: tour.tenantId?.name || "Verified Operator",
      slug: tour.tenantId?.slug || "",
      marketplaceSettings: tour.tenantId?.marketplaceSettings || null,
    },
    marketplaceAvailabilitySettings: tour.marketplaceAvailabilitySettings || null,
    marketplaceAvailability: availability.entries.map((entry) => ({
      date: entry.date || null,
      status: entry.status || "available",
      remainingSpots: typeof entry.remainingSpots === "number" ? entry.remainingSpots : null,
      note: entry.note || "",
      bookable: entry.bookable === true,
      instantBookable: entry.instantBookable === true,
      source: entry.source || "manual",
      daysUntilDeparture: entry.daysUntilDeparture,
    })),
    availabilitySummary: {
      entries: availability.entries.map((entry) => ({
        date: entry.date || null,
        status: entry.status || "available",
      })),
      hasPublishedDates: availability.hasPublishedDates,
      upcomingDatesCount: availability.upcomingDatesCount,
      availableCount: availability.availableCount,
      limitedCount: availability.limitedCount,
      instantBookableCount: availability.instantBookableCount,
      nextPublishedDate: availability.nextPublishedDate,
      nextUpcomingDate: availability.nextUpcomingDate,
      nextBookableDate: availability.nextBookableDate,
      nextInstantBookableDate: availability.nextInstantBookableDate,
      requestOnly: availability.requestOnly,
      instantBookingEnabled: availability.instantBookingEnabled,
    },
  };
};

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
      availability,
      departureMonth,
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

    const tours = await TourPackage.find(query)
      .sort(buildDiscoverySort(sort))
      .populate("tenantId", "name slug")
      .lean();

    const toursWithMarketplace = await Promise.all(
      tours.map(async (tour) =>
        toDiscoveryCardWithEngagement(
          tour,
          await fetchMarketplaceSnapshot(tour._id)
        )
      )
    );

    const filteredTours = toursWithMarketplace.filter((tour) => {
      if (!matchesAvailabilityFilter(tour.availabilitySummary || {}, String(availability || ""))) {
        return false;
      }

      if (!matchesDepartureMonth(tour.availabilitySummary || {}, String(departureMonth || ""))) {
        return false;
      }

      return true;
    });
    const total = filteredTours.length;
    const skip = (parsedPage - 1) * parsedLimit;
    const pagedTours = filteredTours.slice(skip, skip + parsedLimit);

    res.status(200).json({
      tours: pagedTours,
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

/**
 * GET /api/discovery/hospitality/recommendations
 * Return AI-shaped pairings across visible tours, hotels, and restaurants.
 */
router.get("/hospitality/recommendations", async (req, res) => {
  try {
    const source = await resolveHospitalitySource(req.query);
    const surface = toTrimmedString(req.query.surface) || "marketplace";
    const sessionKey = toTrimmedString(req.query.sessionKey);

    const [hotels, restaurants, tours] = await Promise.all([
      Hotel.find({ published: true, marketplaceVisible: true }).lean(),
      Restaurant.find({ published: true, marketplaceVisible: true }).lean(),
      TourPackage.find({ isMarketplaceVisible: true }).lean(),
    ]);

    res.status(200).json(
      buildHospitalityRecommendations({
        source,
        hotels,
        restaurants,
        tours,
        sessionKey,
        surface,
      })
    );
  } catch (error) {
    res.status(200).json({
      recommendations: [],
      emptyReason: "No strong hospitality pairings yet.",
      error: error.message,
    });
  }
});

export default router;
