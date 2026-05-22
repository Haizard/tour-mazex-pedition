const compact = (values = []) =>
  values.map((value) => String(value || "").trim()).filter(Boolean);

export const getRestaurantTrustLabel = (restaurant = {}) => {
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

export const getRestaurantFitExplanation = (restaurant = {}) => {
  const parts = compact([
    Array.isArray(restaurant.cuisineTypes) && restaurant.cuisineTypes.length
      ? `${restaurant.cuisineTypes.slice(0, 2).join(" and ")} dining`
      : "",
    Array.isArray(restaurant.mealTypes) && restaurant.mealTypes.length
      ? `good for ${restaurant.mealTypes.slice(0, 2).join(" and ")}`
      : "",
    Array.isArray(restaurant.dietaryFits) && restaurant.dietaryFits.length
      ? `supports ${restaurant.dietaryFits.slice(0, 2).join(" and ")} preferences`
      : "",
    Array.isArray(restaurant.ambianceTags) && restaurant.ambianceTags.length
      ? `with a ${restaurant.ambianceTags.slice(0, 2).join(" and ")} feel`
      : "",
  ]);

  if (!parts.length) {
    return "The AI concierge uses the restaurant's known cuisine, meal, dietary, and atmosphere fields to explain fit without inventing reservations or menu details.";
  }

  return `This restaurant stands out for ${parts.join(", ")}. The AI concierge keeps its guidance grounded in the visible dining fields and operator context.`;
};

export const getRestaurantTrustSummary = (restaurant = {}) =>
  restaurant.trust?.summary ||
  restaurant.trustSummary ||
  "Trust signals are grounded in the restaurant's published rating, reviews, and operator-linked marketplace profile.";
