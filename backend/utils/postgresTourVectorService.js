import { syncAssistantKnowledgeEmbedding, deleteAssistantKnowledgeEmbedding } from "./pgvectorRetrieval.js";

/**
 * Orchestrates the semantic indexing of a Tour Package.
 * @param {Object} tour - The TourPackage document or object.
 * @param {Object} env - Environment variables.
 */
export const syncTourPackageVector = async (tour = {}, env = globalThis.process?.env || {}) => {
  if (!tour._id || !tour.tenantId) return;

  const itineraryText = (tour.itinerary || [])
    .map((day) => `Day ${day.day}: ${(day.events || []).join(", ")}`)
    .join(". ");

  const highlights = (tour.inclusions || []).slice(0, 5).join(", ");

  const body = [
    `Type: ${tour.tourType || ""}`,
    `Category: ${tour.category || ""}`,
    `Location: ${tour.location || ""}`,
    `Description: ${tour.description || ""}`,
    `Itinerary: ${itineraryText}`,
    `Highlights: ${highlights}`,
  ].filter(Boolean).join("\n");

  const metadata = {
    price: tour.price,
    duration: tour.duration,
    location: tour.location,
    isGroupTour: tour.isGroupTour,
    category: tour.category,
    tourType: tour.tourType,
  };

  await syncAssistantKnowledgeEmbedding({
    sourceType: "tour-package",
    sourceId: String(tour._id),
    tenantId: String(tour.tenantId),
    title: tour.title || "",
    body,
    metadata,
  }, env);
};

/**
 * Removes a Tour Package from the semantic index.
 */
export const deleteTourPackageVector = async (tourId, env) => {
  await deleteAssistantKnowledgeEmbedding({
    sourceType: "tour-package",
    sourceId: String(tourId),
  }, env);
};
