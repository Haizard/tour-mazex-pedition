const SERVICE_TYPES = new Set([
  "breakfast",
  "lunch",
  "dinner",
  "brunch",
  "private-dining",
  "event-dining",
  "custom",
]);

const RECORD_STATUSES = new Set(["active", "paused", "archived"]);
const CAPACITY_MODES = new Set(["table_type", "seat_count", "on_request"]);
const AVAILABILITY_STATUSES = new Set(["open", "limited", "sold_out", "on_request", "closed"]);
const REQUEST_SOURCES = new Set(["direct", "itinerary", "operator-assisted"]);
const REQUEST_STATUSES = new Set([
  "pending",
  "confirmed",
  "declined",
  "needs-clarification",
  "cancelled",
]);

const toTrimmedString = (value) => String(value || "").trim();

const toPositiveInt = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toNonNegativeInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const toStringArray = (value) =>
  Array.isArray(value) ? value.map((item) => toTrimmedString(item)).filter(Boolean) : [];

const normalizeEnum = (value, allowed, fallback) => {
  const normalized = toTrimmedString(value).toLowerCase();
  return allowed.has(normalized) ? normalized : fallback;
};

export const normalizeServiceWindowPayload = (payload = {}) => ({
  label: toTrimmedString(payload.label),
  serviceType: normalizeEnum(payload.serviceType, SERVICE_TYPES, "custom"),
  defaultStartTime: toTrimmedString(payload.defaultStartTime),
  defaultEndTime: toTrimmedString(payload.defaultEndTime),
  capacityMode: normalizeEnum(payload.capacityMode, CAPACITY_MODES, "table_type"),
  status: normalizeEnum(payload.status, RECORD_STATUSES, "active"),
  notes: toTrimmedString(payload.notes),
});

export const normalizeTableTypePayload = (payload = {}) => {
  const minGuests = toPositiveInt(payload.minGuests, 1);
  const maxGuests = Math.max(toPositiveInt(payload.maxGuests, minGuests), minGuests);

  return {
    label: toTrimmedString(payload.label),
    minGuests,
    maxGuests,
    quantity: toNonNegativeInt(payload.quantity, 1),
    status: normalizeEnum(payload.status, RECORD_STATUSES, "active"),
    notes: toTrimmedString(payload.notes),
  };
};

export const normalizeAvailabilityPayload = (payload = {}) => ({
  serviceWindowId: payload.serviceWindowId || null,
  tableTypeId: payload.tableTypeId || null,
  date: toTrimmedString(payload.date),
  status: normalizeEnum(payload.status, AVAILABILITY_STATUSES, "on_request"),
  availableUnits: toNonNegativeInt(payload.availableUnits, 0),
  availableSeats: toNonNegativeInt(payload.availableSeats, 0),
  notes: toTrimmedString(payload.notes),
});

export const normalizeReservationRequestPayload = (payload = {}) => ({
  serviceWindowId: payload.serviceWindowId || null,
  tableTypeId: payload.tableTypeId || null,
  travelerName: toTrimmedString(payload.travelerName),
  travelerEmail: toTrimmedString(payload.travelerEmail).toLowerCase(),
  travelerPhone: toTrimmedString(payload.travelerPhone),
  date: toTrimmedString(payload.date),
  preferredTime: toTrimmedString(payload.preferredTime),
  guestCount: toPositiveInt(payload.guestCount, 1),
  seatingPreference: toTrimmedString(payload.seatingPreference),
  dietaryNotes: toTrimmedString(payload.dietaryNotes),
  occasion: toTrimmedString(payload.occasion),
  selectedMenuItemIds: toStringArray(payload.selectedMenuItemIds),
  selectedMenuItems: Array.isArray(payload.selectedMenuItems)
    ? payload.selectedMenuItems.filter((item) => item && typeof item === "object")
    : [],
  groupMealNotes: toTrimmedString(payload.groupMealNotes),
  preorderInterest: payload.preorderInterest === true,
  source: normalizeEnum(payload.source, REQUEST_SOURCES, "direct"),
  status: normalizeEnum(payload.status, REQUEST_STATUSES, "pending"),
  publicNotes: toTrimmedString(payload.publicNotes || payload.notes),
  partnerNotes: toTrimmedString(payload.partnerNotes),
  linkedInquiryId: payload.linkedInquiryId || null,
  linkedQuoteId: payload.linkedQuoteId || null,
  itineraryContext: payload.itineraryContext && typeof payload.itineraryContext === "object"
    ? payload.itineraryContext
    : {},
});

export const summarizeRestaurantAvailability = (entries = []) => {
  const normalizedEntries = Array.isArray(entries) ? entries : [];
  const totalAvailableUnits = normalizedEntries.reduce(
    (sum, entry) => sum + toNonNegativeInt(entry.availableUnits, 0),
    0
  );
  const totalAvailableSeats = normalizedEntries.reduce(
    (sum, entry) => sum + toNonNegativeInt(entry.availableSeats, 0),
    0
  );
  const statuses = new Set(normalizedEntries.map((entry) => entry.status));
  const status = statuses.has("open")
    ? "open"
    : statuses.has("limited")
      ? "limited"
      : statuses.has("on_request")
        ? "on_request"
        : statuses.has("sold_out")
          ? "sold_out"
          : "closed";

  return {
    status,
    totalAvailableUnits,
    totalAvailableSeats,
    hasAvailability: ["open", "limited", "on_request"].includes(status),
  };
};

export const buildReservationAutopilot = (request = {}) => {
  const guestCount = toPositiveInt(request.guestCount, 1);
  const dietaryNotes = toTrimmedString(request.dietaryNotes);
  const occasion = toTrimmedString(request.occasion);
  const isEvent = /event|private|birthday|anniversary|wedding|corporate/i.test(occasion);
  const isGroup = guestCount >= 8;
  const classification = isEvent
    ? "event-dining"
    : isGroup
      ? "group-dining"
      : dietaryNotes
        ? "dietary-sensitive"
        : request.source === "itinerary"
          ? "itinerary-dining"
          : "direct-dining";

  return {
    classification,
    urgency: isEvent || isGroup ? "high" : "normal",
    requiresHumanReview: isEvent || isGroup || Boolean(dietaryNotes),
    nextBestAction: isEvent || isGroup
      ? "Confirm space, timing, and group dining requirements before promising availability."
      : dietaryNotes
        ? "Confirm dietary needs and share the request with the restaurant team."
        : "Confirm preferred time and respond with next available dining options.",
    replyHint: "Acknowledge the request, confirm the date/time details, and explain that availability will be verified before confirmation.",
  };
};

export const shapePublicReservationOptions = ({
  serviceWindows = [],
  tableTypes = [],
  availabilityEntries = [],
} = {}) => {
  const activeServiceWindows = serviceWindows
    .filter((item) => (item.status || "active") === "active")
    .map((item) => ({
      id: String(item._id || item.id),
      label: item.label,
      serviceType: item.serviceType || "custom",
      defaultStartTime: item.defaultStartTime || "",
      defaultEndTime: item.defaultEndTime || "",
      capacityMode: item.capacityMode || "table_type",
      notes: item.notes || "",
    }));

  const activeTableTypes = tableTypes
    .filter((item) => (item.status || "active") === "active")
    .map((item) => ({
      id: String(item._id || item.id),
      label: item.label,
      minGuests: toPositiveInt(item.minGuests, 1),
      maxGuests: toPositiveInt(item.maxGuests, 2),
      quantity: toNonNegativeInt(item.quantity, 0),
      notes: item.notes || "",
    }));

  const publicAvailability = availabilityEntries.filter((entry) => entry.status !== "closed");

  return {
    serviceWindows: activeServiceWindows,
    tableTypes: activeTableTypes,
    availabilityEntries: publicAvailability.map((entry) => ({
      id: String(entry._id || entry.id || `${entry.date}-${entry.status}`),
      serviceWindowId: entry.serviceWindowId ? String(entry.serviceWindowId) : null,
      tableTypeId: entry.tableTypeId ? String(entry.tableTypeId) : null,
      date: entry.date,
      status: entry.status,
      availableUnits: toNonNegativeInt(entry.availableUnits, 0),
      availableSeats: toNonNegativeInt(entry.availableSeats, 0),
      notes: entry.notes || "",
    })),
    availabilitySummary: summarizeRestaurantAvailability(publicAvailability),
  };
};

export const shapeReservationRequest = (request = {}) => ({
  id: String(request._id || request.id || ""),
  restaurantId: request.restaurantId ? String(request.restaurantId) : "",
  serviceWindowId: request.serviceWindowId ? String(request.serviceWindowId) : null,
  tableTypeId: request.tableTypeId ? String(request.tableTypeId) : null,
  travelerName: request.travelerName || "",
  travelerEmail: request.travelerEmail || "",
  travelerPhone: request.travelerPhone || "",
  date: request.date || "",
  preferredTime: request.preferredTime || "",
  guestCount: toPositiveInt(request.guestCount, 1),
  seatingPreference: request.seatingPreference || "",
  dietaryNotes: request.dietaryNotes || "",
  occasion: request.occasion || "",
  selectedMenuItemIds: toStringArray(request.selectedMenuItemIds),
  selectedMenuItems: Array.isArray(request.selectedMenuItems) ? request.selectedMenuItems : [],
  groupMealNotes: request.groupMealNotes || "",
  preorderInterest: request.preorderInterest === true,
  source: request.source || "direct",
  status: request.status || "pending",
  publicNotes: request.publicNotes || "",
  partnerNotes: request.partnerNotes || "",
  linkedInquiryId: request.linkedInquiryId ? String(request.linkedInquiryId) : null,
  linkedQuoteId: request.linkedQuoteId ? String(request.linkedQuoteId) : null,
  itineraryContext: request.itineraryContext || {},
  autopilot: request.autopilot || {},
  createdAt: request.createdAt || null,
  updatedAt: request.updatedAt || null,
});

export const buildReservationStatusUpdate = (payload = {}) => ({
  status: normalizeEnum(payload.status, REQUEST_STATUSES, "pending"),
  partnerNotes: toTrimmedString(payload.partnerNotes),
});
