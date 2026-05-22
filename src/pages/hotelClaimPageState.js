const splitList = (value = "") =>
  String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export const createEmptyHotelClaimDraft = () => ({
  claimType: "existing-listing",
  claimantName: "",
  claimantEmail: "",
  claimantPhone: "",
  claimantRole: "hotel-owner",
  proofNote: "",
  proofLinks: "",
  requestedUsername: "",
  password: "",
  proposedHotelName: "",
  proposedDestination: "",
  proposedRegion: "",
  proposedAccommodationType: "hotel",
  proposedAmenities: "",
  proposedPhotos: "",
  proposedSummary: "",
});

export const buildHotelClaimSearchParams = (filters = {}) =>
  Object.entries({
    q: String(filters.q || "").trim(),
    destination: String(filters.destination || "").trim(),
  }).reduce((payload, [key, value]) => {
    if (value) {
      payload[key] = value;
    }
    return payload;
  }, {});

export const buildHotelClaimPayload = (draft = {}, selectedHotel = null) => {
  const payload = {
    claimType: draft.claimType === "new-listing-request" ? "new-listing-request" : "existing-listing",
    claimantName: String(draft.claimantName || "").trim(),
    claimantEmail: String(draft.claimantEmail || "").trim(),
    claimantPhone: String(draft.claimantPhone || "").trim(),
    claimantRole: draft.claimantRole === "hotel-manager" ? "hotel-manager" : "hotel-owner",
    proofNote: String(draft.proofNote || "").trim(),
    proofLinks: String(draft.proofLinks || "").trim(),
    requestedUsername: String(draft.requestedUsername || "").trim(),
    password: String(draft.password || ""),
    hotelId: selectedHotel?.id || "",
    hotelNameSnapshot: selectedHotel?.name || "",
    destinationSnapshot: selectedHotel?.destination || "",
  };

  if (payload.claimType === "new-listing-request") {
    payload.proposedHotelPayload = {
      name: String(draft.proposedHotelName || "").trim(),
      destination: String(draft.proposedDestination || "").trim(),
      region: String(draft.proposedRegion || "").trim(),
      accommodationType: String(draft.proposedAccommodationType || "hotel").trim(),
      amenities: splitList(draft.proposedAmenities),
      photos: splitList(draft.proposedPhotos),
      summary: String(draft.proposedSummary || "").trim(),
    };
    payload.hotelNameSnapshot = payload.proposedHotelPayload.name;
    payload.destinationSnapshot = payload.proposedHotelPayload.destination;
  }

  return payload;
};
