const toTrimmedString = (value) => String(value || "").trim();

const toPositiveInt = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const normalizeReservationOptions = (options = {}) => ({
  serviceWindows: (options.serviceWindows || []).map((service) => ({
    ...service,
    value: service.id || service._id || "",
    label: service.defaultStartTime
      ? `${service.label} (${service.defaultStartTime}${service.defaultEndTime ? `-${service.defaultEndTime}` : ""})`
      : service.label,
  })),
  tableTypes: (options.tableTypes || []).map((tableType) => ({
    ...tableType,
    value: tableType.id || tableType._id || "",
    label: `${tableType.label} (${tableType.minGuests || 1}-${tableType.maxGuests || 2} guests)`,
  })),
  availabilityEntries: options.availabilityEntries || [],
  availabilitySummary: options.availabilitySummary || {
    status: "on_request",
    totalAvailableUnits: 0,
    totalAvailableSeats: 0,
  },
});

export const validateReservationRequestForm = (form = {}) => {
  const errors = {};

  if (!toTrimmedString(form.travelerName)) {
    errors.travelerName = "Name is required.";
  }

  if (!toTrimmedString(form.travelerEmail)) {
    errors.travelerEmail = "Email is required.";
  }

  if (!toTrimmedString(form.date)) {
    errors.date = "Date is required.";
  }

  if (!toTrimmedString(form.preferredTime)) {
    errors.preferredTime = "Preferred time is required.";
  }

  if (toPositiveInt(form.guestCount, 0) < 1) {
    errors.guestCount = "Guest count must be at least 1.";
  }

  return errors;
};

const toStringArray = (value) =>
  Array.isArray(value) ? value.map((item) => toTrimmedString(item)).filter(Boolean) : [];

export const buildRestaurantReservationPayload = (form = {}, context = {}) => ({
  serviceWindowId: form.serviceWindowId || null,
  tableTypeId: form.tableTypeId || null,
  travelerName: toTrimmedString(form.travelerName),
  travelerEmail: toTrimmedString(form.travelerEmail).toLowerCase(),
  travelerPhone: toTrimmedString(form.travelerPhone),
  date: toTrimmedString(form.date),
  preferredTime: toTrimmedString(form.preferredTime),
  guestCount: toPositiveInt(form.guestCount, 1),
  seatingPreference: toTrimmedString(form.seatingPreference),
  dietaryNotes: toTrimmedString(form.dietaryNotes),
  occasion: toTrimmedString(form.occasion),
  publicNotes: toTrimmedString(form.publicNotes),
  selectedMenuItemIds: toStringArray(form.selectedMenuItemIds),
  groupMealNotes: toTrimmedString(form.groupMealNotes),
  preorderInterest: form.preorderInterest === true,
  source: context.source || "direct",
  itineraryContext: context.itineraryContext || {},
});

export const getReservationAvailabilityTone = (status = "on_request") => {
  const tones = {
    open: { label: "Open", tone: "open" },
    limited: { label: "Limited", tone: "limited" },
    sold_out: { label: "Sold out", tone: "closed" },
    on_request: { label: "On request", tone: "request" },
    closed: { label: "Closed", tone: "closed" },
  };

  return tones[status] || tones.on_request;
};
