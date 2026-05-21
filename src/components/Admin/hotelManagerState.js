const unique = (values = []) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

export const createEmptyHotelDraft = () => ({
  name: "",
  slug: "",
  summary: "",
  description: "",
  destination: "",
  region: "",
  accommodationType: "hotel",
  amenities: [],
  amenitiesText: "",
  roomStyleSummary: "",
  photos: [],
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

export const buildHotelPayload = (draft = {}) => {
  const amenities = Array.isArray(draft.amenities)
    ? draft.amenities
    : String(draft.amenitiesText || "")
        .split(",")
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
    accommodationType: String(draft.accommodationType || "hotel").trim(),
    amenities: unique(amenities),
    roomStyleSummary: String(draft.roomStyleSummary || "").trim(),
    photos: Array.isArray(draft.photos) ? draft.photos : [],
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

export const filterHotelRows = (hotels = [], filters = {}) => {
  const search = String(filters.search || "").trim().toLowerCase();
  const status = String(filters.status || "").trim();

  return hotels.filter((hotel) => {
    if (status === "public" && !(hotel.published && hotel.marketplaceVisible)) return false;
    if (status === "draft" && hotel.published) return false;
    if (status === "sponsored" && !hotel.sponsoredPlacement) return false;

    if (!search) return true;

    return [hotel.name, hotel.destination, hotel.region, hotel.accommodationType]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
};
