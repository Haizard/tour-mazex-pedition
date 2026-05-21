const normalized = (value = "") => String(value || "").trim().toLowerCase();

export const countActiveHotelFilters = (filters = {}) =>
  Object.entries(filters).filter(([key, value]) => key !== "sort" && normalized(value)).length;

export const filterHotelCards = (hotels = [], filters = {}) =>
  hotels.filter((hotel) => {
    const search = normalized(filters.q);
    if (
      search &&
      ![hotel.name, hotel.summary, hotel.destination, hotel.region]
        .filter(Boolean)
        .some((value) => normalized(value).includes(search))
    ) {
      return false;
    }

    if (filters.destination && !normalized(hotel.destination).includes(normalized(filters.destination))) {
      return false;
    }

    if (
      filters.accommodationType &&
      !normalized(hotel.accommodationType).includes(normalized(filters.accommodationType))
    ) {
      return false;
    }

    if (
      filters.amenity &&
      !(hotel.amenities || []).some((amenity) => normalized(amenity).includes(normalized(filters.amenity)))
    ) {
      return false;
    }

    return true;
  });

export const buildHotelInquiryPayload = ({ hotel = {}, intentType = "direct-hotel", traveler = {} } = {}) => ({
  ...traveler,
  hotelId: String(hotel._id || hotel.id || ""),
  hotelName: hotel.name || "",
  hotelIntentType: intentType,
  destinations: hotel.destination ? [hotel.destination] : traveler.destinations || ["Flexible"],
  accommodationPreferences: [hotel.name, hotel.accommodationType].filter(Boolean),
  sourceChannel: "global-marketplace",
  campaignLabel: `hotel_${hotel._id || hotel.id || "unknown"}`,
  operatorTenantId: hotel.operator?.id || "",
  operatorTenantSlug: hotel.operator?.slug || "",
  message:
    traveler.message ||
    `I'm interested in ${hotel.name || "this hotel"} and would like guidance on availability, fit, and itinerary options.`,
});
