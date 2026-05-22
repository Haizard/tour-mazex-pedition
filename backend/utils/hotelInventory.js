const toCleanString = (value = "") => String(value || "").trim();

const toOptionalNumber = (value) => {
  if (value === null || value === "" || typeof value === "undefined") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeCurrency = (value = "") => {
  const normalized = toCleanString(value).toUpperCase();
  return normalized || "USD";
};

export const normalizeHotelInventoryPayload = (body = {}) => ({
  roomInventory: Array.isArray(body.roomInventory)
    ? body.roomInventory
        .map((entry = {}) => {
          const roomTypeCode = toCleanString(entry.roomTypeCode || entry.code).toLowerCase();
          const label = toCleanString(entry.label || entry.name);

          if (!roomTypeCode || !label) {
            return null;
          }

          return {
            roomTypeCode,
            label,
            capacity: Number(toOptionalNumber(entry.capacity) || 0),
            totalUnits: Number(toOptionalNumber(entry.totalUnits) || 0),
            baseNightlyRate: toOptionalNumber(entry.baseNightlyRate),
            currency: normalizeCurrency(entry.currency),
            boardBasis: toCleanString(entry.boardBasis),
            active: entry.active !== false,
          };
        })
        .filter(Boolean)
    : [],
  inventorySettings: {
    autoExtendCalendar: body.inventorySettings?.autoExtendCalendar === true,
    monthsAhead: Number(toOptionalNumber(body.inventorySettings?.monthsAhead) || 3),
    defaultCurrency: normalizeCurrency(body.inventorySettings?.defaultCurrency),
    defaultStatus: ["open", "limited", "sold-out", "on-request", "closed"].includes(
      body.inventorySettings?.defaultStatus
    )
      ? body.inventorySettings.defaultStatus
      : "open",
    checkInCutoffDays: Number(toOptionalNumber(body.inventorySettings?.checkInCutoffDays) || 0),
  },
});

export const normalizeHotelAvailabilityEntries = (entries = []) =>
  (Array.isArray(entries) ? entries : [])
    .map((entry = {}) => {
      const date = toCleanString(entry.date);
      const roomTypeCode = toCleanString(entry.roomTypeCode).toLowerCase();

      if (!date || !roomTypeCode) {
        return null;
      }

      return {
        date,
        roomTypeCode,
        status: ["open", "limited", "sold-out", "on-request", "closed"].includes(entry.status)
          ? entry.status
          : "open",
        availableUnits: Number(toOptionalNumber(entry.availableUnits) || 0),
        nightlyRate: toOptionalNumber(entry.nightlyRate),
        currency: entry.currency ? normalizeCurrency(entry.currency) : "",
        minStay: Number(toOptionalNumber(entry.minStay) || 1),
        note: toCleanString(entry.note),
      };
    })
    .filter(Boolean)
    .sort((left, right) => String(left.date).localeCompare(String(right.date)));

const titleCase = (value = "") => {
  const normalized = toCleanString(value).toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/-/g, " ") : "";
};

export const buildHotelInventorySummary = (hotel = {}) => {
  const entries = Array.isArray(hotel.availabilityCalendar) ? hotel.availabilityCalendar : [];
  const roomInventory = Array.isArray(hotel.roomInventory) ? hotel.roomInventory : [];
  const nextOpen = entries.find(
    (entry) => ["open", "limited", "on-request"].includes(String(entry.status || ""))
  );
  const pricedEntries = entries.filter((entry) => Number.isFinite(Number(entry.nightlyRate)));
  const fromRate = pricedEntries.length
    ? Math.min(...pricedEntries.map((entry) => Number(entry.nightlyRate)))
    : null;

  return {
    roomTypeCount: roomInventory.length,
    totalEntries: entries.length,
    nextAvailableDate: nextOpen?.date || null,
    nextStatus: nextOpen?.status || "",
    nextStatusLabel: titleCase(nextOpen?.status || ""),
    fromRate,
    currency:
      pricedEntries.find((entry) => entry.currency)?.currency ||
      hotel.inventorySettings?.defaultCurrency ||
      "USD",
  };
};
