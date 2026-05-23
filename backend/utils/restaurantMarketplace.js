const regex = (value = "") => new RegExp(String(value).trim(), "i");

const compact = (values = []) =>
  values.map((value) => String(value || "").trim()).filter(Boolean);

export {
  buildRestaurantConciergeRecommendations,
  buildRestaurantConciergeRequest,
} from "./restaurantAiConcierge.js";

export const getRestaurantReviewLabel = (restaurant = {}) => {
  const rating = Number(restaurant.averageRating || 0);
  const count = Number(restaurant.reviewCount || 0);

  if (rating > 0 && count > 0) {
    return `${rating.toFixed(1).replace(/\.0$/, "")}/5 from ${count} reviews`;
  }

  if (count > 0) {
    return `${count} traveler reviews`;
  }

  return "Dining trust signals building";
};

export const getRestaurantFitTags = (restaurant = {}) =>
  compact([
    ...(Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes.slice(0, 2) : []),
    ...(Array.isArray(restaurant.mealTypes) ? restaurant.mealTypes.slice(0, 1) : []),
    ...(Array.isArray(restaurant.dietaryFits) ? restaurant.dietaryFits.slice(0, 2) : []),
    ...(Array.isArray(restaurant.ambianceTags) ? restaurant.ambianceTags.slice(0, 2) : []),
  ]).map((value) => value.charAt(0).toUpperCase() + value.slice(1));

export const buildRestaurantOperatorLabel = (restaurant = {}) =>
  restaurant.tenantId?.name
    ? `Operator-routed by ${restaurant.tenantId.name}`
    : "Operator-routed dining request";

export const buildRestaurantDiningContextLabel = (restaurant = {}) =>
  compact([
    ...(Array.isArray(restaurant.mealTypes) ? restaurant.mealTypes.slice(0, 1) : []),
    ...(Array.isArray(restaurant.ambianceTags) ? restaurant.ambianceTags.slice(0, 1) : []),
  ]).join(" · ");

const buildRestaurantDiningReassuranceItems = (restaurant = {}) =>
  compact([
    restaurant.openingHoursSummary || "Dining timing is confirmed during operator follow-up.",
    restaurant.reservationStyleSummary || "Reservations and menu details are confirmed after inquiry.",
    Array.isArray(restaurant.dietaryFits) && restaurant.dietaryFits.length
      ? `Published dietary fit signals include ${restaurant.dietaryFits.slice(0, 2).join(" and ")}.`
      : "AI fit guidance uses stored cuisine, timing, dietary, and atmosphere fields only.",
    "AI suggestions do not confirm reservations, menu availability, pricing, or table guarantees.",
  ]);

export const shapeRestaurantDiscoveryCard = (restaurant = {}) => ({
  _id: String(restaurant._id || ""),
  name: restaurant.name || "",
  slug: restaurant.slug || "",
  summary: restaurant.summary || "",
  description: restaurant.description || "",
  destination: restaurant.destination || "",
  region: restaurant.region || "",
  cuisineTypes: Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes : [],
  mealTypes: Array.isArray(restaurant.mealTypes) ? restaurant.mealTypes : [],
  dietaryFits: Array.isArray(restaurant.dietaryFits) ? restaurant.dietaryFits : [],
  ambianceTags: Array.isArray(restaurant.ambianceTags) ? restaurant.ambianceTags : [],
  openingHoursSummary: restaurant.openingHoursSummary || "",
  reservationStyleSummary: restaurant.reservationStyleSummary || "",
  photos: Array.isArray(restaurant.photos) ? restaurant.photos : [],
  averageRating: restaurant.averageRating ?? null,
  reviewCount: Number(restaurant.reviewCount || 0),
  sponsoredPlacement: restaurant.sponsoredPlacement === true,
  operator: {
    id: restaurant.tenantId?._id
      ? String(restaurant.tenantId._id)
      : String(restaurant.tenantId || ""),
    name: restaurant.tenantId?.name || "Verified Operator",
    slug: restaurant.tenantId?.slug || "",
  },
  trust: {
    reviewLabel: getRestaurantReviewLabel(restaurant),
    summary: restaurant.trustSummary || "",
    operatorLabel: buildRestaurantOperatorLabel(restaurant),
  },
  diningContextLabel: buildRestaurantDiningContextLabel(restaurant),
  fitTags: getRestaurantFitTags(restaurant),
});

export const shapeRestaurantDetail = (restaurant = {}) => ({
  ...shapeRestaurantDiscoveryCard(restaurant),
  geo: restaurant.geo || { latitude: null, longitude: null },
  partnerAccountId: restaurant.partnerAccountId ? String(restaurant.partnerAccountId) : "",
  conversion: {
    sendInquiry: {
      restaurantId: String(restaurant._id || ""),
      restaurantName: restaurant.name || "",
      restaurantIntentType: "direct-restaurant",
    },
    requestInItinerary: {
      restaurantId: String(restaurant._id || ""),
      restaurantName: restaurant.name || "",
      restaurantIntentType: "itinerary-add-on",
    },
  },
  aiConcierge: {
    groundingWarning:
      "AI guidance is based on known restaurant fields and must not invent reservations, menu details, prices, or confirmations.",
  },
  trustModules: {
    operatorCredibility: {
      title: "Operator credibility",
      body: buildRestaurantOperatorLabel(restaurant),
    },
    restaurantProof: {
      title: "Restaurant proof",
      items: compact([
        getRestaurantReviewLabel(restaurant),
        restaurant.destination ? `Published for ${restaurant.destination}` : "",
        buildRestaurantDiningContextLabel(restaurant),
      ]),
    },
    diningReassurance: {
      title: "Dining reassurance",
      items: buildRestaurantDiningReassuranceItems(restaurant),
    },
  },
});

export const buildRestaurantDiscoveryQuery = ({
  q = "",
  destination = "",
  region = "",
  cuisine = "",
  mealType = "",
  dietaryFit = "",
  ambiance = "",
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
  if (cuisine) query.cuisineTypes = { $regex: regex(cuisine) };
  if (mealType) query.mealTypes = { $regex: regex(mealType) };
  if (dietaryFit) query.dietaryFits = { $regex: regex(dietaryFit) };
  if (ambiance) query.ambianceTags = { $regex: regex(ambiance) };

  return query;
};

export const buildRestaurantSort = (sort = "") => {
  if (sort === "rating") return { averageRating: -1, reviewCount: -1, sponsoredPlacement: -1 };
  if (sort === "newest") return { createdAt: -1, sponsoredPlacement: -1 };
  return { sponsoredPlacement: -1, averageRating: -1, createdAt: -1 };
};
