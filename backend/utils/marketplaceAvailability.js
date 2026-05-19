const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeDate = (value) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return null;
  }
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
};

const isoDate = (value) => {
  const parsed = normalizeDate(value);
  return parsed ? parsed.toISOString() : null;
};

const toArray = (value) => (Array.isArray(value) ? value : []);
const isPublishedEntry = (entry = {}) => entry?.published !== false;

const deriveRemainingSpots = (tour = {}, entry = {}, settings = {}) => {
  if (typeof entry.remainingSpots === "number") {
    return entry.remainingSpots;
  }

  if (typeof settings.defaultRemainingSpots === "number") {
    return settings.defaultRemainingSpots;
  }

  if (tour.isGroupTour === true && typeof tour.maxCapacity === "number") {
    const bookings = Number(tour.currentBookings || 0);
    return Math.max(tour.maxCapacity - bookings, 0);
  }

  return null;
};

const shouldGenerateTemplateDates = (settings = {}) =>
  settings?.autoGenerateFutureDates === true &&
  settings?.mode === "weekly-template" &&
  toArray(settings.weeklyDepartureDays).length > 0;

const generateTemplateEntries = (tour = {}, settings = {}, referenceDate = new Date()) => {
  if (!shouldGenerateTemplateDates(settings)) {
    return [];
  }

  const today = normalizeDate(referenceDate) || new Date();
  const monthsAhead = Math.min(Math.max(Number(settings.monthsAhead || 3), 1), 18);
  const maxGenerated = Math.min(Math.max(Number(settings.maxGeneratedDates || 18), 3), 48);
  const weekdays = [...new Set(toArray(settings.weeklyDepartureDays).map((value) => Number(value)).filter((value) => value >= 0 && value <= 6))];
  const status = settings.defaultGeneratedStatus || "available";

  const generated = [];
  const seen = new Set();
  const cursor = new Date(today);
  const cutoffDate = new Date(today);
  cutoffDate.setMonth(cutoffDate.getMonth() + monthsAhead);

  while (cursor <= cutoffDate && generated.length < maxGenerated) {
    if (weekdays.includes(cursor.getDay())) {
      const key = isoDate(cursor);
      if (key && !seen.has(key)) {
        seen.add(key);
        generated.push({
          date: key,
          status,
          published: true,
          remainingSpots: deriveRemainingSpots(tour, {}, settings),
          note: settings.generatedNote || "",
          source: "generated",
        });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return generated;
};

export const computeAvailabilityEntries = (tour = {}, options = {}) => {
  const referenceDate = normalizeDate(options.referenceDate || new Date()) || new Date();
  const settings = tour.marketplaceAvailabilitySettings || {};

  const manualEntries = toArray(tour.marketplaceAvailability)
    .filter((entry) => isPublishedEntry(entry))
    .map((entry) => {
      const date = isoDate(entry?.date);
      if (!date) {
        return null;
      }

      return {
        date,
        status: entry?.status || "available",
        published: isPublishedEntry(entry),
        remainingSpots: deriveRemainingSpots(tour, entry || {}, settings),
        note: entry?.note || "",
        source: "manual",
      };
    })
    .filter(Boolean);

  const generatedEntries = generateTemplateEntries(tour, settings, referenceDate);
  const mergedByDate = new Map();

  for (const entry of [...generatedEntries, ...manualEntries]) {
    mergedByDate.set(entry.date, {
      ...mergedByDate.get(entry.date),
      ...entry,
    });
  }

  return [...mergedByDate.values()]
    .map((entry) => {
      const dateValue = normalizeDate(entry.date);
      const daysUntilDeparture = dateValue
        ? Math.floor((dateValue.getTime() - referenceDate.getTime()) / DAY_MS)
        : null;
      const bookingCutoffDays = Math.max(Number(settings.bookingCutoffDays || 0), 0);
      const status = entry.status || "available";
      const isUpcoming = daysUntilDeparture != null ? daysUntilDeparture >= 0 : false;
      const hasInventory =
        typeof entry.remainingSpots === "number" ? entry.remainingSpots > 0 : true;
      const requestState = status === "on-request";
      const bookable =
        isUpcoming && hasInventory && (status === "available" || status === "limited" || requestState);
      const instantBookable =
        settings.instantBookingEnabled === true &&
        isUpcoming &&
        hasInventory &&
        daysUntilDeparture >= bookingCutoffDays &&
        (status === "available" || status === "limited");

      return {
        ...entry,
        status,
        isUpcoming,
        daysUntilDeparture,
        bookable,
        instantBookable,
        requestState,
      };
    })
    .sort((left, right) => new Date(left.date) - new Date(right.date));
};

export const buildAvailabilitySummary = (tour = {}, options = {}) => {
  const entries = computeAvailabilityEntries(tour, options);
  const upcoming = entries.filter((entry) => entry.isUpcoming);
  const bookable = upcoming.filter((entry) => entry.bookable);
  const instantBookable = upcoming.filter((entry) => entry.instantBookable);
  const availableStatuses = upcoming.filter((entry) => entry.status === "available");
  const limitedStatuses = upcoming.filter((entry) => entry.status === "limited");
  const requestOnly = upcoming.length > 0 && bookable.every((entry) => entry.requestState === true);

  return {
    entries,
    hasPublishedDates: entries.length > 0,
    upcomingDatesCount: upcoming.length,
    availableCount: availableStatuses.length,
    limitedCount: limitedStatuses.length,
    instantBookableCount: instantBookable.length,
    nextPublishedDate: entries[0]?.date || null,
    nextUpcomingDate: upcoming[0]?.date || null,
    nextBookableDate: bookable[0]?.date || null,
    nextInstantBookableDate: instantBookable[0]?.date || null,
    requestOnly,
    instantBookingEnabled: tour.marketplaceAvailabilitySettings?.instantBookingEnabled === true,
  };
};

export const matchesAvailabilityFilter = (summary = {}, filter = "") => {
  if (!filter) {
    return true;
  }

  if (filter === "upcoming") {
    return Number(summary.upcomingDatesCount || 0) > 0;
  }

  if (filter === "bookable") {
    return Boolean(summary.nextBookableDate);
  }

  if (filter === "instant") {
    return Boolean(summary.nextInstantBookableDate);
  }

  if (filter === "request") {
    return summary.requestOnly === true || Number(summary.upcomingDatesCount || 0) === 0;
  }

  return true;
};

export const matchesDepartureMonth = (summary = {}, departureMonth = "") => {
  if (!departureMonth) {
    return true;
  }

  return (summary.entries || []).some((entry) => String(entry.date || "").startsWith(departureMonth));
};
