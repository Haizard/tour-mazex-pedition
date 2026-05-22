const unique = (values = []) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

export const createEmptyRestaurantDraft = () => ({
  name: "",
  slug: "",
  summary: "",
  description: "",
  destination: "",
  region: "",
  cuisineTypes: [],
  cuisineTypesText: "",
  mealTypes: [],
  mealTypesText: "",
  dietaryFits: [],
  dietaryFitsText: "",
  ambianceTags: [],
  ambianceTagsText: "",
  openingHoursSummary: "",
  reservationStyleSummary: "",
  photos: [],
  photosText: "",
  averageRating: "",
  reviewCount: "",
  latitude: "",
  longitude: "",
  trustSummary: "",
  published: false,
  marketplaceVisible: false,
  sponsoredPlacement: false,
  status: "draft",
  partnerAccountId: "",
});

export const buildRestaurantPayload = (draft = {}) => {
  const splitValues = (value) =>
    String(value || "")
      .split(/\r?\n|,/)
      .map((item) => item.trim());

  const latitude = Number(draft.latitude);
  const longitude = Number(draft.longitude);

  return {
    name: String(draft.name || "").trim(),
    slug: String(draft.slug || "").trim().toLowerCase(),
    summary: String(draft.summary || "").trim(),
    description: String(draft.description || "").trim(),
    destination: String(draft.destination || "").trim(),
    region: String(draft.region || "").trim(),
    cuisineTypes: unique(splitValues(draft.cuisineTypesText)),
    mealTypes: unique(splitValues(draft.mealTypesText)),
    dietaryFits: unique(splitValues(draft.dietaryFitsText)),
    ambianceTags: unique(splitValues(draft.ambianceTagsText)),
    openingHoursSummary: String(draft.openingHoursSummary || "").trim(),
    reservationStyleSummary: String(draft.reservationStyleSummary || "").trim(),
    photos: unique(splitValues(draft.photosText)),
    averageRating: draft.averageRating === "" ? null : Number(draft.averageRating),
    reviewCount: draft.reviewCount === "" ? 0 : Number(draft.reviewCount),
    geo: {
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
    },
    trustSummary: String(draft.trustSummary || "").trim(),
    published: draft.published === true,
    marketplaceVisible: draft.marketplaceVisible === true,
    sponsoredPlacement: draft.sponsoredPlacement === true,
    status: draft.status || "draft",
    partnerAccountId: draft.partnerAccountId || null,
  };
};

export const filterRestaurantRows = (restaurants = [], filters = {}) => {
  const search = String(filters.search || "").trim().toLowerCase();
  const status = String(filters.status || "").trim();

  return restaurants.filter((restaurant) => {
    if (status === "public" && !(restaurant.published && restaurant.marketplaceVisible)) return false;
    if (status === "draft" && restaurant.published) return false;
    if (status === "sponsored" && !restaurant.sponsoredPlacement) return false;

    if (!search) return true;

    return [
      restaurant.name,
      restaurant.destination,
      restaurant.region,
      ...(restaurant.cuisineTypes || []),
      ...(restaurant.mealTypes || []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
};
