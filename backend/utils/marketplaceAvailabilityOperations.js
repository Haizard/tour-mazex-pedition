import { computeAvailabilityEntries } from "./marketplaceAvailability.js";
import { buildMarketplaceAvailabilityHealth } from "./marketplaceAvailabilityHealth.js";

export const buildMarketplaceAvailabilityRows = (tours = [], options = {}) =>
  (Array.isArray(tours) ? tours : []).flatMap((tour) => {
    if (!tour) {
      return [];
    }

    return computeAvailabilityEntries(tour, options).map((entry) => ({
      rowId: `${String(tour._id || "tour")}:${entry.date}`,
      tourId: String(tour._id || ""),
      packageTitle: tour.title || "",
      location: tour.location || "",
      dateKey: String(entry.date || "").slice(0, 10),
      status: entry.status || "available",
      source: entry.source || "manual",
      remainingSpots: typeof entry.remainingSpots === "number" ? entry.remainingSpots : null,
      note: entry.note || "",
      requestOnly: entry.requestState === true,
      instantReady: entry.instantBookable === true,
      bookable: entry.bookable === true,
      isUpcoming: entry.isUpcoming === true,
      daysUntilDeparture:
        typeof entry.daysUntilDeparture === "number" ? entry.daysUntilDeparture : null,
    }));
  });

export { buildMarketplaceAvailabilityHealth };
