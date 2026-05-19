import { computeAvailabilityEntries } from "./marketplaceAvailability.js";
import { buildMarketplaceAvailabilityHealth } from "./marketplaceAvailabilityHealth.js";

const buildDemandMap = (savedTripLists = []) => {
  const demandByTourId = new Map();

  for (const list of Array.isArray(savedTripLists) ? savedTripLists : []) {
    for (const tourId of list.selectedTourIds || []) {
      const key = String(tourId || "");
      if (!key) continue;
      const current = demandByTourId.get(key) || {
        savedTripCount: 0,
        reminderWatcherCount: 0,
      };
      current.savedTripCount += 1;
      demandByTourId.set(key, current);
    }

    if (list.reminders?.enabled === true) {
      for (const watchState of list.reminders?.watchStates || []) {
        const key = String(watchState?.tourId || "");
        if (!key) continue;
        const current = demandByTourId.get(key) || {
          savedTripCount: 0,
          reminderWatcherCount: 0,
        };
        current.reminderWatcherCount += 1;
        demandByTourId.set(key, current);
      }
    }
  }

  return demandByTourId;
};

export const buildMarketplaceAvailabilityRows = (tours = [], options = {}, demandMap = new Map()) =>
  (Array.isArray(tours) ? tours : []).flatMap((tour) => {
    if (!tour) {
      return [];
    }

    const tourDemand = demandMap.get(String(tour._id || "")) || {
      savedTripCount: 0,
      reminderWatcherCount: 0,
    };

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
      savedTripCount: tourDemand.savedTripCount,
      reminderWatcherCount: tourDemand.reminderWatcherCount,
      demandScore: Number(tourDemand.savedTripCount || 0) + Number(tourDemand.reminderWatcherCount || 0),
    }));
  });

export const buildMarketplaceAvailabilityWorkspace = ({
  tours = [],
  savedTripLists = [],
  options = {},
} = {}) => {
  const demandMap = buildDemandMap(savedTripLists);
  const rows = buildMarketplaceAvailabilityRows(tours, options, demandMap);
  const health = buildMarketplaceAvailabilityHealth(tours);
  const demandTotals = [...demandMap.values()].reduce(
    (accumulator, demand) => ({
      savedTripCount: accumulator.savedTripCount + Number(demand.savedTripCount || 0),
      reminderWatcherCount:
        accumulator.reminderWatcherCount + Number(demand.reminderWatcherCount || 0),
    }),
    { savedTripCount: 0, reminderWatcherCount: 0 }
  );

  return {
    rows,
    health,
    tours: (Array.isArray(tours) ? tours : []).map((tour) => {
      const demand = demandMap.get(String(tour._id || "")) || {
        savedTripCount: 0,
        reminderWatcherCount: 0,
      };

      return {
        id: String(tour._id || ""),
        title: tour.title || "",
        location: tour.location || "",
        savedTripCount: demand.savedTripCount,
        reminderWatcherCount: demand.reminderWatcherCount,
        demandScore: Number(demand.savedTripCount || 0) + Number(demand.reminderWatcherCount || 0),
      };
    }),
    summary: {
      liveTourCount: (Array.isArray(tours) ? tours : []).filter((tour) => tour?.isMarketplaceVisible === true).length,
      departureCount: rows.length,
      instantReadyCount: rows.filter((row) => row.instantReady === true).length,
      requestOnlyCount: rows.filter((row) => row.requestOnly === true).length,
      savedTripCount: demandTotals.savedTripCount,
      reminderWatcherCount: demandTotals.reminderWatcherCount,
      healthAlertCount: health.length,
    },
  };
};

export { buildMarketplaceAvailabilityHealth };
