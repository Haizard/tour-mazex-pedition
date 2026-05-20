const formatAvailabilityDate = (value = "") => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const buildTripComparisonFields = (trip = {}) => [
  ["Starting price", `$${Number(trip.price || 0).toLocaleString()}`],
  ["Duration", trip.duration || "Multi-day"],
  ["Location", trip.location || "East Africa"],
  [
    "Next departure",
    trip.marketplaceAvailability?.[0]
      ? `${trip.marketplaceAvailability[0].status} - ${formatAvailabilityDate(
          trip.marketplaceAvailability[0].date,
        )}${
          typeof trip.marketplaceAvailability[0].remainingSpots === "number"
            ? ` (${trip.marketplaceAvailability[0].remainingSpots} spots)`
            : ""
        }`
      : "Request next available dates",
  ],
  ["Travel style", trip.category || trip.tourType || "Curated journey"],
  [
    "Review summary",
    trip.marketplace?.averageRating
      ? `${trip.marketplace.averageRating}/5 from ${trip.marketplace.reviewCount || 0} reviews`
      : "New feedback profile",
  ],
  [
    "Inclusions snapshot",
    (trip.inclusions || []).slice(0, 3).join(", ") || "Ask operator for inclusions",
  ],
  [
    "Destinations",
    (trip.destinationsVisited || []).slice(0, 4).join(", ") || "Route details on request",
  ],
];
