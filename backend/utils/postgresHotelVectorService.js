import {
  deleteAssistantKnowledgeEmbedding,
  syncAssistantKnowledgeEmbedding,
} from "./pgvectorRetrieval.js";

export const buildHotelAssistantKnowledgeRecord = (hotel = {}) => {
  const amenities = Array.isArray(hotel.amenities) ? hotel.amenities.join(", ") : "";
  const body = [
    `Destination: ${hotel.destination || ""}`,
    `Region: ${hotel.region || ""}`,
    `Accommodation type: ${hotel.accommodationType || "hotel"}`,
    `Summary: ${hotel.summary || ""}`,
    `Description: ${hotel.description || ""}`,
    `Room style: ${hotel.roomStyleSummary || ""}`,
    `Amenities: ${amenities}`,
    hotel.averageRating ? `Rating: ${hotel.averageRating}` : "",
    hotel.reviewCount ? `Reviews: ${hotel.reviewCount}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    sourceType: "hotel-listing",
    sourceId: String(hotel._id || ""),
    tenantId: String(hotel.tenantId?._id || hotel.tenantId || ""),
    title: hotel.name || "",
    body,
    metadata: {
      destination: hotel.destination || "",
      region: hotel.region || "",
      accommodationType: hotel.accommodationType || "hotel",
      marketplaceVisible: hotel.marketplaceVisible === true,
      published: hotel.published === true,
      sponsoredPlacement: hotel.sponsoredPlacement === true,
    },
  };
};

export const syncHotelListingVector = async (
  hotel = {},
  env = globalThis.process?.env || {}
) => {
  if (!hotel._id || !hotel.tenantId) return;

  await syncAssistantKnowledgeEmbedding(buildHotelAssistantKnowledgeRecord(hotel), env);
};

export const deleteHotelListingVector = async (hotelId, env = globalThis.process?.env || {}) => {
  await deleteAssistantKnowledgeEmbedding(
    {
      sourceType: "hotel-listing",
      sourceId: String(hotelId || ""),
    },
    env
  );
};
