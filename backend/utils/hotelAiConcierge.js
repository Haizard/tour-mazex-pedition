const normalize = (value = "") => String(value || "").trim().toLowerCase();

const compactUnique = (values = []) => [
  ...new Set(values.map((value) => normalize(value)).filter(Boolean)),
];

const includesNormalized = (value = "", query = "") =>
  Boolean(query) && normalize(value).includes(normalize(query));

const publicHotel = (hotel = {}) =>
  hotel.published === true && hotel.marketplaceVisible === true;

export const buildHotelConciergeRequest = (body = {}) => ({
  destination: normalize(body.destination),
  accommodationType: normalize(body.accommodationType),
  amenities: compactUnique(Array.isArray(body.amenities) ? body.amenities : []),
  tripIntent: normalize(body.tripIntent || "hotel-fit"),
});

const scoreHotel = (hotel = {}, request = {}) => {
  const reasons = [];
  let fitScore = 0;

  if (includesNormalized(hotel.destination, request.destination)) {
    fitScore += 35;
    reasons.push(`Matches ${hotel.destination}`);
  }

  if (includesNormalized(hotel.accommodationType, request.accommodationType)) {
    fitScore += 25;
    reasons.push(`Offers ${hotel.accommodationType} style accommodation`);
  }

  const hotelAmenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];
  const matchedAmenities = request.amenities.filter((requestedAmenity) =>
    hotelAmenities.some((amenity) => includesNormalized(amenity, requestedAmenity))
  );

  if (matchedAmenities.length) {
    fitScore += matchedAmenities.length * 10;
    reasons.push(`Includes ${matchedAmenities.join(", ")}`);
  }

  const rating = Number(hotel.averageRating || 0);
  const reviewCount = Number(hotel.reviewCount || 0);
  if (rating > 0 && reviewCount > 0) {
    fitScore += Math.min(15, rating * 2 + Math.min(5, reviewCount / 10));
    reasons.push(`${rating.toFixed(1).replace(/\.0$/, "")}/5 traveler review signal`);
  }

  if (!reasons.length) {
    reasons.push("Available as a public hotel option for operator review");
  }

  return { fitScore, reasons };
};

export const buildHotelConciergeRecommendations = (hotels = [], body = {}) => {
  const request = buildHotelConciergeRequest(body);

  return hotels
    .filter(publicHotel)
    .map((hotel) => {
      const { fitScore, reasons } = scoreHotel(hotel, request);

      return {
        hotelId: String(hotel._id || hotel.id || ""),
        name: hotel.name || "",
        slug: hotel.slug || "",
        destination: hotel.destination || "",
        accommodationType: hotel.accommodationType || "hotel",
        fitScore,
        reasons,
        suggestedIntent:
          request.tripIntent === "direct-hotel" ? "direct-hotel" : "itinerary-add-on",
        guardrail:
          "Grounded in known hotel fields only; confirm availability, prices, and supplier commitments with the operator.",
      };
    })
    .sort((left, right) => right.fitScore - left.fitScore || left.name.localeCompare(right.name))
    .slice(0, 5);
};
