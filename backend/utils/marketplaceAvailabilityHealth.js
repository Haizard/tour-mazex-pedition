import { buildAvailabilitySummary } from "./marketplaceAvailability.js";

export const buildMarketplaceAvailabilityHealth = (tours = []) =>
  (Array.isArray(tours) ? tours : [])
    .flatMap((tour) => {
      if (!tour || tour.isMarketplaceVisible !== true) {
        return [];
      }

      const summary = buildAvailabilitySummary(tour);
      const warnings = [];

      if (summary.hasPublishedDates !== true) {
        warnings.push({
          tourId: String(tour._id || ""),
          title: tour.title || "",
          reason: "missing-published-dates",
          severity: "high",
        });
      }

      if (
        tour.marketplaceAvailabilitySettings?.instantBookingEnabled === true &&
        !summary.nextInstantBookableDate
      ) {
        warnings.push({
          tourId: String(tour._id || ""),
          title: tour.title || "",
          reason: "instant-booking-blocked",
          severity: "medium",
        });
      }

      return warnings;
    });
