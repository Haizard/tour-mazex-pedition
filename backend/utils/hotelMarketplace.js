import { buildHotelInventorySummary } from "./hotelInventory.js";

const regex = (value = "") => new RegExp(String(value).trim(), "i");

const compact = (values = []) =>
  values.map((value) => String(value || "").trim()).filter(Boolean);

export {
  buildHotelConciergeRecommendations,
  buildHotelConciergeRequest,
} from "./hotelAiConcierge.js";

export const getHotelReviewLabel = (hotel = {}) => {
  const rating = Number(hotel.averageRating || 0);
  const count = Number(hotel.reviewCount || 0);

  if (rating > 0 && count > 0) {
    return `${rating.toFixed(1).replace(/\.0$/, "")}/5 from ${count} reviews`;
  }

  if (count > 0) {
    return `${count} traveler reviews`;
  }

  return "Trust signals building";
};

export const getHotelFitTags = (hotel = {}) =>
  compact([
    hotel.accommodationType ? `${hotel.accommodationType} stay` : "",
    hotel.destination,
    ...(Array.isArray(hotel.amenities) ? hotel.amenities.slice(0, 3) : []),
  ]).map((value) => value.charAt(0).toUpperCase() + value.slice(1));

export const shapeHotelDiscoveryCard = (hotel = {}) => ({
  _id: String(hotel._id || ""),
  name: hotel.name || "",
  slug: hotel.slug || "",
  summary: hotel.summary || "",
  destination: hotel.destination || "",
  region: hotel.region || "",
  accommodationType: hotel.accommodationType || "hotel",
  amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
  roomStyleSummary: hotel.roomStyleSummary || "",
  photos: Array.isArray(hotel.photos) ? hotel.photos : [],
  averageRating: hotel.averageRating ?? null,
  reviewCount: Number(hotel.reviewCount || 0),
  sponsoredPlacement: hotel.sponsoredPlacement === true,
  operator: {
    id: hotel.tenantId?._id ? String(hotel.tenantId._id) : String(hotel.tenantId || ""),
    name: hotel.tenantId?.name || "Verified Operator",
    slug: hotel.tenantId?.slug || "",
  },
  trust: {
    reviewLabel: getHotelReviewLabel(hotel),
    summary: hotel.trustSummary || "",
  },
  fitTags: getHotelFitTags(hotel),
  inventorySummary: buildHotelInventorySummary(hotel),
});

export const shapeHotelDetail = (hotel = {}) => ({
  ...shapeHotelDiscoveryCard(hotel),
  description: hotel.description || "",
  geo: hotel.geo || { latitude: null, longitude: null },
  partnerAccountId: hotel.partnerAccountId ? String(hotel.partnerAccountId) : "",
  conversion: {
    sendInquiry: {
      hotelId: String(hotel._id || ""),
      hotelName: hotel.name || "",
      hotelIntentType: "direct-hotel",
    },
    requestInItinerary: {
      hotelId: String(hotel._id || ""),
      hotelName: hotel.name || "",
      hotelIntentType: "itinerary-add-on",
    },
  },
  aiConcierge: {
    groundingWarning:
      "AI guidance is based on known hotel fields and must not invent availability, prices, or confirmations.",
  },
});

export const buildHotelDiscoveryQuery = ({
  q = "",
  destination = "",
  region = "",
  accommodationType = "",
  amenity = "",
} = {}) => {
  const query = {
    published: true,
    marketplaceVisible: true,
  };

  if (q) {
    const search = regex(q);
    query.$or = [
      { name: { $regex: search } },
      { summary: { $regex: search } },
      { description: { $regex: search } },
      { destination: { $regex: search } },
    ];
  }

  if (destination) query.destination = { $regex: regex(destination) };
  if (region) query.region = { $regex: regex(region) };
  if (accommodationType) query.accommodationType = { $regex: regex(accommodationType) };
  if (amenity) query.amenities = { $regex: regex(amenity) };

  return query;
};

export const buildHotelSort = (sort = "") => {
  if (sort === "rating") return { averageRating: -1, reviewCount: -1, sponsoredPlacement: -1 };
  if (sort === "newest") return { createdAt: -1, sponsoredPlacement: -1 };
  return { sponsoredPlacement: -1, averageRating: -1, createdAt: -1 };
};
