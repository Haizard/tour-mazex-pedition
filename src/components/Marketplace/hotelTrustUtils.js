export const getHotelTrustLabel = (hotel = {}) => {
  const rating = Number(hotel.averageRating || 0);
  const count = Number(hotel.reviewCount || 0);

  if (rating > 0 && count > 0) {
    return `${rating.toFixed(1).replace(/\.0$/, "")}/5 from ${count} reviews`;
  }

  if (count > 0) {
    return `${count} traveler reviews`;
  }

  return "Trust signals building";
};

export const getHotelTrustSummary = (hotel = {}) => {
  if (hotel.trustSummary) {
    return hotel.trustSummary;
  }

  if (Number(hotel.reviewCount || 0) > 0) {
    return `${hotel.name || "This hotel"} has traveler proof available through marketplace review signals.`;
  }

  return "Trust signals will grow here as reviews, partner history, and traveler proof are added.";
};

export const getHotelFitExplanation = (hotel = {}) => {
  const parts = [];

  if (hotel.destination) {
    parts.push(`fits trips flowing through ${hotel.destination}`);
  }

  if (hotel.accommodationType) {
    parts.push(`offers a ${hotel.accommodationType} style stay`);
  }

  if (hotel.roomStyleSummary) {
    parts.push(`has ${hotel.roomStyleSummary}`);
  }

  const amenities = Array.isArray(hotel.amenities) ? hotel.amenities.slice(0, 3) : [];
  if (amenities.length) {
    parts.push(`includes ${amenities.join(", ")}`);
  }

  if (!parts.length) {
    return "This hotel can be assessed once destination, room style, and amenity details are added.";
  }

  return `${hotel.name || "This hotel"} ${parts.join(", ")}. Confirm availability and pricing with the operator before making commitments.`;
};
