const uniqueValues = (values = []) => [
  ...new Set(
    values
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  ),
];

export const buildHotelConciergePreferenceDraft = (hotel = {}) => ({
  destination: hotel.destination || "",
  accommodationType: hotel.accommodationType || "",
  amenities: Array.isArray(hotel.amenities) ? hotel.amenities.slice(0, 2) : [],
  amenitiesText: Array.isArray(hotel.amenities)
    ? hotel.amenities.slice(0, 2).join(", ")
    : "",
  tripIntent: "hotel-fit",
});

export const buildHotelConciergeRequestPayload = (draft = {}) => ({
  destination: String(draft.destination || "").trim(),
  accommodationType: String(draft.accommodationType || "").trim(),
  amenities: uniqueValues(
    String(draft.amenitiesText || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  ),
  tripIntent: String(draft.tripIntent || "hotel-fit").trim() || "hotel-fit",
});
