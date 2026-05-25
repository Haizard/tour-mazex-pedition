const toTrimmedString = (value) => String(value || "").trim();

const toPositiveInt = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toNonNegativeInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const groupReservationOperationsByRestaurant = ({
  restaurants = [],
  operationsByRestaurant = {},
} = {}) =>
  restaurants.map((restaurant) => {
    const restaurantId = String(restaurant._id || restaurant.id || "");
    const operations = operationsByRestaurant[restaurantId] || {};

    return {
      restaurantId,
      restaurant,
      serviceWindows: operations.serviceWindows || [],
      tableTypes: operations.tableTypes || [],
      availabilityEntries: operations.availabilityEntries || [],
      reservationRequests: operations.reservationRequests || [],
    };
  });

export const buildServiceWindowPayload = (form = {}) => ({
  label: toTrimmedString(form.label),
  serviceType: toTrimmedString(form.serviceType) || "custom",
  defaultStartTime: toTrimmedString(form.defaultStartTime),
  defaultEndTime: toTrimmedString(form.defaultEndTime),
  capacityMode: toTrimmedString(form.capacityMode) || "table_type",
  status: toTrimmedString(form.status) || "active",
  notes: toTrimmedString(form.notes),
});

export const buildTableTypePayload = (form = {}) => ({
  label: toTrimmedString(form.label),
  minGuests: toPositiveInt(form.minGuests, 1),
  maxGuests: Math.max(toPositiveInt(form.maxGuests, 2), toPositiveInt(form.minGuests, 1)),
  quantity: toNonNegativeInt(form.quantity, 1),
  status: toTrimmedString(form.status) || "active",
  notes: toTrimmedString(form.notes),
});

export const buildAvailabilityPayload = (form = {}) => ({
  serviceWindowId: form.serviceWindowId || null,
  tableTypeId: form.tableTypeId || null,
  date: toTrimmedString(form.date),
  status: toTrimmedString(form.status) || "on_request",
  availableUnits: toNonNegativeInt(form.availableUnits, 0),
  availableSeats: toNonNegativeInt(form.availableSeats, 0),
  notes: toTrimmedString(form.notes),
});

export const buildReservationStatusPayload = (form = {}) => ({
  status: toTrimmedString(form.status) || "pending",
  partnerNotes: toTrimmedString(form.partnerNotes),
});

export const formatReservationRequestSummary = (request = {}) =>
  `${request.travelerName || "Traveler"}, ${toPositiveInt(request.guestCount, 1)} guests on ${
    request.date || "date pending"
  } at ${request.preferredTime || "time pending"}`;
