export const createEmptyPartnerHotelDraft = () => ({
  name: "",
  summary: "",
  description: "",
  destination: "",
  region: "",
  amenities: "",
  roomStyleSummary: "",
  photos: "",
  trustSummary: "",
});

const splitList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const buildPartnerHotelUpdatePayload = (draft = {}) => ({
  name: String(draft.name || "").trim(),
  summary: String(draft.summary || "").trim(),
  description: String(draft.description || "").trim(),
  destination: String(draft.destination || "").trim(),
  region: String(draft.region || "").trim(),
  amenities: splitList(draft.amenities),
  roomStyleSummary: String(draft.roomStyleSummary || "").trim(),
  photos: splitList(draft.photos),
  trustSummary: String(draft.trustSummary || "").trim(),
});

export const filterPartnerHotels = (hotels = [], search = "") => {
  const needle = String(search || "").trim().toLowerCase();

  if (!needle) {
    return hotels;
  }

  return hotels.filter((hotel = {}) =>
    [hotel.name, hotel.destination, hotel.region]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle))
  );
};
