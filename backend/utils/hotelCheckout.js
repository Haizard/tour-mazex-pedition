const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDateKey = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeString = (value = "") => String(value || "").trim();

const roundMoney = (value) => Number((Number(value || 0) + Number.EPSILON).toFixed(2));

export const calculateStayNights = ({ checkInDate, checkOutDate } = {}) => {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    throw new Error("Valid check-in and check-out dates are required.");
  }

  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
  if (nights < 1) {
    throw new Error("Check-out must be at least one night after check-in.");
  }

  return nights;
};

export const buildStayDateKeys = ({ checkInDate, checkOutDate } = {}) => {
  const nights = calculateStayNights({ checkInDate, checkOutDate });
  const checkIn = new Date(checkInDate);
  return Array.from({ length: nights }, (_, index) => {
    const next = new Date(checkIn.getTime() + index * MS_PER_DAY);
    return next.toISOString().slice(0, 10);
  });
};

const buildEntryLookup = (hotel = {}) =>
  (Array.isArray(hotel.availabilityCalendar) ? hotel.availabilityCalendar : []).reduce((lookup, entry = {}) => {
    const key = `${toDateKey(entry.date)}::${normalizeString(entry.roomTypeCode).toLowerCase()}`;
    if (key !== "::") {
      lookup.set(key, entry);
    }
    return lookup;
  }, new Map());

const findRoomInventoryEntry = (hotel = {}, roomTypeCode = "") =>
  (Array.isArray(hotel.roomInventory) ? hotel.roomInventory : []).find(
    (entry = {}) => normalizeString(entry.roomTypeCode).toLowerCase() === normalizeString(roomTypeCode).toLowerCase()
  );

export const normalizeHotelCheckoutSettings = (hotel = {}) => {
  const settings = hotel.checkoutSettings || {};
  const inventorySettings = hotel.inventorySettings || {};
  return {
    currency: normalizeString(settings.currency || inventorySettings.defaultCurrency || "USD").toUpperCase() || "USD",
    taxPercent: toNumber(settings.taxPercent, 0),
    serviceFeePercent: toNumber(settings.serviceFeePercent, 0),
    cleaningFee: toNumber(settings.cleaningFee, 0),
    depositPercent: toNumber(settings.depositPercent, 100),
    allowPayNow: settings.allowPayNow !== false,
    instantBookable: settings.instantBookable === true,
    cancellationPolicy: normalizeString(settings.cancellationPolicy),
    checkInTime: normalizeString(settings.checkInTime),
    checkOutTime: normalizeString(settings.checkOutTime),
  };
};

export const buildHotelCheckoutQuote = (hotel = {}, request = {}) => {
  const roomTypeCode = normalizeString(request.roomTypeCode).toLowerCase();
  const guestCount = Math.max(1, toNumber(request.guestCount, 1));
  const units = Math.max(1, toNumber(request.units, 1));

  if (!roomTypeCode) {
    throw new Error("Room type is required.");
  }

  const roomType = findRoomInventoryEntry(hotel, roomTypeCode);
  if (!roomType) {
    throw new Error("Selected room type is not available on this hotel.");
  }

  const dateKeys = buildStayDateKeys(request);
  const entryLookup = buildEntryLookup(hotel);
  const matchedEntries = dateKeys.map((dateKey) => ({
    date: dateKey,
    entry: entryLookup.get(`${dateKey}::${roomTypeCode}`) || null,
  }));

  const missingDates = matchedEntries.filter(({ entry }) => !entry).map(({ date }) => date);
  if (missingDates.length) {
    throw new Error(`This room type does not have published rates for ${missingDates.join(", ")}.`);
  }

  const closedEntry = matchedEntries.find(({ entry }) =>
    ["sold-out", "closed"].includes(normalizeString(entry?.status))
  );
  if (closedEntry) {
    throw new Error(`This room type is not bookable on ${closedEntry.date}.`);
  }

  const lowStockEntry = matchedEntries.find(({ entry }) => {
    const status = normalizeString(entry?.status);
    const availableUnits = toNumber(entry?.availableUnits, 0);
    return (status === "open" || status === "limited") && availableUnits < units;
  });
  if (lowStockEntry) {
    throw new Error(`Only ${toNumber(lowStockEntry.entry.availableUnits, 0)} unit(s) are available on ${lowStockEntry.date}.`);
  }

  const settings = normalizeHotelCheckoutSettings(hotel);
  const pricedNights = matchedEntries.map(({ date, entry }) => ({
    date,
    rate: toNumber(entry.nightlyRate, toNumber(roomType.baseNightlyRate, 0)),
    status: normalizeString(entry.status || "open"),
    currency: normalizeString(entry.currency || settings.currency).toUpperCase() || settings.currency,
    minStay: toNumber(entry.minStay, 1),
  }));

  const invalidMinStay = pricedNights.find((night) => night.minStay > dateKeys.length);
  if (invalidMinStay) {
    throw new Error(`This room type requires at least ${invalidMinStay.minStay} nights for ${invalidMinStay.date}.`);
  }

  const subtotal = roundMoney(pricedNights.reduce((sum, night) => sum + night.rate * units, 0));
  const taxes = roundMoney((subtotal * settings.taxPercent) / 100);
  const serviceFee = roundMoney((subtotal * settings.serviceFeePercent) / 100);
  const cleaningFee = roundMoney(settings.cleaningFee);
  const total = roundMoney(subtotal + taxes + serviceFee + cleaningFee);
  const depositDue = settings.allowPayNow
    ? roundMoney((total * Math.min(Math.max(settings.depositPercent, 0), 100)) / 100)
    : 0;
  const availabilityMode = pricedNights.some((night) => night.status === "on-request")
    ? "on-request"
    : settings.instantBookable
      ? "instant-bookable"
      : "operator-review";

  return {
    hotelId: String(hotel._id || ""),
    hotelName: normalizeString(hotel.name),
    destination: normalizeString(hotel.destination),
    roomTypeCode,
    roomTypeLabel: normalizeString(roomType.label || roomTypeCode),
    checkInDate: toDateKey(request.checkInDate),
    checkOutDate: toDateKey(request.checkOutDate),
    nights: dateKeys.length,
    guestCount,
    units,
    capacityPerUnit: toNumber(roomType.capacity, 2),
    currency: settings.currency,
    pricedNights,
    pricing: {
      subtotal,
      taxes,
      serviceFee,
      cleaningFee,
      total,
      depositDue,
      balanceDue: roundMoney(total - depositDue),
    },
    availabilityMode,
    paymentMode: settings.allowPayNow ? "payment-checkout" : "request-only",
    settings,
  };
};

export const buildHotelReservationDraft = ({ hotel = {}, quote = {}, traveler = {} } = {}) => ({
  hotelId: hotel._id,
  hotelName: hotel.name || "",
  destination: hotel.destination || "",
  travelerName: normalizeString(`${traveler.firstName || ""} ${traveler.lastName || ""}`),
  travelerEmail: normalizeString(traveler.email),
  travelerPhone: normalizeString(traveler.phone),
  checkInDate: quote.checkInDate || null,
  checkOutDate: quote.checkOutDate || null,
  guestCount: quote.guestCount || 1,
  units: quote.units || 1,
  roomTypeCode: quote.roomTypeCode || "",
  roomPlan: quote.roomTypeLabel || "",
  sourceChannel: "global-marketplace",
  hotelIntentType: "direct-booking",
  pricing: {
    ...quote.pricing,
    currency: quote.currency || "USD",
    nights: quote.nights || 1,
    availabilityMode: quote.availabilityMode || "operator-review",
  },
});
