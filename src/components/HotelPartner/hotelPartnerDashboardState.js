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

export const createEmptyPartnerRequestDraft = () => ({
  status: "confirmed",
  reservationCode: "",
  notes: "",
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

export const buildPartnerAccommodationResponsePayload = (draft = {}) => ({
  status: ["pending", "confirmed", "cancelled"].includes(draft.status)
    ? draft.status
    : "confirmed",
  reservationCode: String(draft.reservationCode || "").trim(),
  notes: String(draft.notes || "").trim(),
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

export const filterPartnerAccommodationRequests = (requests = [], filters = {}) => {
  const search = String(filters.search || "").trim().toLowerCase();
  const status = String(filters.status || "").trim();

  return requests.filter((request = {}) => {
    if (status && request.status !== status) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      request.bookingGuestName,
      request.hotelName,
      request.assignedTourTitle,
      request.reservationCode,
      request.roomPlan,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
};
