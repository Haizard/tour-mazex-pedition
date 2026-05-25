const splitList = (value = "") =>
  String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export const createEmptyRestaurantClaimDraft = () => ({
  claimType: "existing-listing",
  claimantName: "",
  claimantEmail: "",
  claimantPhone: "",
  claimantRole: "restaurant-owner",
  proofNote: "",
  proofLinks: "",
  requestedUsername: "",
  password: "",
  proposedRestaurantName: "",
  proposedDestination: "",
  proposedRegion: "",
  proposedCuisineTypes: "",
  proposedMealTypes: "",
  proposedDietaryFits: "",
  proposedPhotos: "",
  proposedSummary: "",
});

export const buildRestaurantClaimSearchParams = (filters = {}) =>
  Object.entries({
    q: String(filters.q || "").trim(),
    destination: String(filters.destination || "").trim(),
  }).reduce((payload, [key, value]) => {
    if (value) {
      payload[key] = value;
    }
    return payload;
  }, {});

export const buildRestaurantClaimPayload = (draft = {}, selectedRestaurant = null) => {
  const payload = {
    claimType:
      draft.claimType === "new-listing-request"
        ? "new-listing-request"
        : "existing-listing",
    claimantName: String(draft.claimantName || "").trim(),
    claimantEmail: String(draft.claimantEmail || "").trim(),
    claimantPhone: String(draft.claimantPhone || "").trim(),
    claimantRole:
      draft.claimantRole === "restaurant-manager"
        ? "restaurant-manager"
        : "restaurant-owner",
    proofNote: String(draft.proofNote || "").trim(),
    proofLinks: String(draft.proofLinks || "").trim(),
    requestedUsername: String(draft.requestedUsername || "").trim(),
    password: String(draft.password || ""),
    restaurantId: selectedRestaurant?.id || selectedRestaurant?._id || "",
    restaurantNameSnapshot: selectedRestaurant?.name || "",
    destinationSnapshot: selectedRestaurant?.destination || "",
  };

  if (payload.claimType === "new-listing-request") {
    payload.proposedRestaurantPayload = {
      name: String(draft.proposedRestaurantName || "").trim(),
      destination: String(draft.proposedDestination || "").trim(),
      region: String(draft.proposedRegion || "").trim(),
      cuisineTypes: splitList(draft.proposedCuisineTypes),
      mealTypes: splitList(draft.proposedMealTypes),
      dietaryFits: splitList(draft.proposedDietaryFits),
      photos: splitList(draft.proposedPhotos),
      summary: String(draft.proposedSummary || "").trim(),
    };
    payload.restaurantNameSnapshot = payload.proposedRestaurantPayload.name;
    payload.destinationSnapshot = payload.proposedRestaurantPayload.destination;
  }

  return payload;
};
