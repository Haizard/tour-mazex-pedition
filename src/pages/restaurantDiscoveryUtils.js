export const filterRestaurantCards = (restaurants = [], filters = {}) => {
  const search = String(filters.q || "").trim().toLowerCase();

  return restaurants.filter((restaurant) => {
    if (
      filters.destination &&
      !String(restaurant.destination || "").toLowerCase().includes(filters.destination.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.cuisine &&
      !(restaurant.cuisineTypes || []).some((item) =>
        String(item).toLowerCase().includes(filters.cuisine.toLowerCase())
      )
    ) {
      return false;
    }

    if (
      filters.mealType &&
      !(restaurant.mealTypes || []).some((item) =>
        String(item).toLowerCase().includes(filters.mealType.toLowerCase())
      )
    ) {
      return false;
    }

    if (
      filters.dietaryFit &&
      !(restaurant.dietaryFits || []).some((item) =>
        String(item).toLowerCase().includes(filters.dietaryFit.toLowerCase())
      )
    ) {
      return false;
    }

    if (!search) return true;

    return [
      restaurant.name,
      restaurant.summary,
      restaurant.description,
      restaurant.destination,
      ...(restaurant.cuisineTypes || []),
      ...(restaurant.mealTypes || []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
};

export const sortRestaurantCards = (restaurants = [], sort = "featured") => {
  const rows = [...restaurants];
  if (sort === "rating") {
    return rows.sort(
      (left, right) =>
        Number(right.averageRating || 0) - Number(left.averageRating || 0) ||
        Number(right.reviewCount || 0) - Number(left.reviewCount || 0)
    );
  }
  if (sort === "newest") {
    return rows.sort(
      (left, right) =>
        new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
    );
  }
  return rows.sort(
    (left, right) =>
      Number(right.sponsoredPlacement === true) - Number(left.sponsoredPlacement === true) ||
      Number(right.averageRating || 0) - Number(left.averageRating || 0)
  );
};

export const countActiveRestaurantFilters = (filters = {}) =>
  ["q", "destination", "cuisine", "mealType", "dietaryFit"]
    .map((key) => String(filters[key] || "").trim())
    .filter(Boolean).length;

export const buildRestaurantIntentOptions = (restaurant = {}) => [
  {
    id: "direct",
    label: "Ask about this restaurant",
    description: "Use the direct dining inquiry path for restaurant-specific requests.",
    intentType: "direct-restaurant",
    payload: {
      sourceChannel: "global-marketplace",
      campaignLabel: restaurant._id ? `restaurant_${restaurant._id}` : "",
      operatorTenantId: restaurant.operator?.id || "",
      operatorTenantSlug: restaurant.operator?.slug || "",
      restaurantId: restaurant._id || "",
      restaurantName: restaurant.name || "",
      restaurantIntentType: "direct-restaurant",
      message: `I would like to ask about ${restaurant.name || "this restaurant"} for my trip.`,
    },
  },
  {
    id: "itinerary",
    label: "Add to my itinerary",
    description: "Ask the operator to include this restaurant inside the wider trip plan.",
    intentType: "itinerary-add-on",
    payload: {
      sourceChannel: "global-marketplace",
      campaignLabel: restaurant._id ? `restaurant_${restaurant._id}` : "",
      operatorTenantId: restaurant.operator?.id || "",
      operatorTenantSlug: restaurant.operator?.slug || "",
      restaurantId: restaurant._id || "",
      restaurantName: restaurant.name || "",
      restaurantIntentType: "itinerary-add-on",
      destinations: [restaurant.destination].filter(Boolean),
      message: `Please include ${restaurant.name || "this restaurant"} in my itinerary if it fits the route.`,
    },
  },
];
