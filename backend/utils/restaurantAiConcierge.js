const normalize = (value = "") => String(value || "").trim().toLowerCase();
const compactUnique = (values = []) => [
  ...new Set(values.map((value) => normalize(value)).filter(Boolean)),
];
const includesNormalized = (value = "", query = "") =>
  Boolean(query) && normalize(value).includes(normalize(query));
const publicRestaurant = (restaurant = {}) =>
  restaurant.published === true && restaurant.marketplaceVisible === true;

export const buildRestaurantConciergeRequest = (body = {}) => ({
  destination: normalize(body.destination),
  mealType: normalize(body.mealType),
  cuisineTypes: compactUnique(Array.isArray(body.cuisineTypes) ? body.cuisineTypes : []),
  dietaryFits: compactUnique(Array.isArray(body.dietaryFits) ? body.dietaryFits : []),
  ambianceTags: compactUnique(Array.isArray(body.ambianceTags) ? body.ambianceTags : []),
  tripIntent: normalize(body.tripIntent || "restaurant-fit"),
});

const scoreRestaurant = (restaurant = {}, request = {}) => {
  const reasons = [];
  let fitScore = 0;

  if (includesNormalized(restaurant.destination, request.destination)) {
    fitScore += 30;
    reasons.push(`Matches ${restaurant.destination}`);
  }

  if (request.mealType) {
    const mealMatch = (restaurant.mealTypes || []).some((mealType) =>
      includesNormalized(mealType, request.mealType)
    );
    if (mealMatch) {
      fitScore += 20;
      reasons.push(`Good fit for ${request.mealType}`);
    }
  }

  const cuisineMatches = request.cuisineTypes.filter((requestedCuisine) =>
    (restaurant.cuisineTypes || []).some((cuisineType) =>
      includesNormalized(cuisineType, requestedCuisine)
    )
  );
  if (cuisineMatches.length) {
    fitScore += cuisineMatches.length * 12;
    reasons.push(`Cuisine match: ${cuisineMatches.join(", ")}`);
  }

  const dietaryMatches = request.dietaryFits.filter((requestedFit) =>
    (restaurant.dietaryFits || []).some((dietaryFit) =>
      includesNormalized(dietaryFit, requestedFit)
    )
  );
  if (dietaryMatches.length) {
    fitScore += dietaryMatches.length * 8;
    reasons.push(`Dietary fit: ${dietaryMatches.join(", ")}`);
  }

  const ambianceMatches = request.ambianceTags.filter((requestedAmbiance) =>
    (restaurant.ambianceTags || []).some((ambianceTag) =>
      includesNormalized(ambianceTag, requestedAmbiance)
    )
  );
  if (ambianceMatches.length) {
    fitScore += ambianceMatches.length * 7;
    reasons.push(`Atmosphere fit: ${ambianceMatches.join(", ")}`);
  }

  const rating = Number(restaurant.averageRating || 0);
  const reviewCount = Number(restaurant.reviewCount || 0);
  if (rating > 0 && reviewCount > 0) {
    fitScore += Math.min(15, rating * 2 + Math.min(5, reviewCount / 10));
    reasons.push(`${rating.toFixed(1).replace(/\.0$/, "")}/5 traveler review signal`);
  }

  if (!reasons.length) {
    reasons.push("Available as a public dining option for operator review");
  }

  return { fitScore, reasons };
};

export const buildRestaurantConciergeRecommendations = (restaurants = [], body = {}) => {
  const request = buildRestaurantConciergeRequest(body);

  return restaurants
    .filter(publicRestaurant)
    .map((restaurant) => {
      const { fitScore, reasons } = scoreRestaurant(restaurant, request);
      return {
        restaurantId: String(restaurant._id || restaurant.id || ""),
        name: restaurant.name || "",
        slug: restaurant.slug || "",
        destination: restaurant.destination || "",
        mealTypes: Array.isArray(restaurant.mealTypes) ? restaurant.mealTypes : [],
        cuisineTypes: Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes : [],
        fitScore,
        reasons,
        suggestedIntent:
          request.tripIntent === "direct-restaurant"
            ? "direct-restaurant"
            : "itinerary-add-on",
        guardrail:
          "Grounded in known restaurant fields only; confirm opening hours, reservations, pricing, and menu specifics with the operator.",
      };
    })
    .sort((left, right) => right.fitScore - left.fitScore || left.name.localeCompare(right.name))
    .slice(0, 5);
};
