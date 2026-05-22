export const createEmptyPartnerHotelDraft = () => ({
  name: "",
  summary: "",
  description: "",
  destination: "",
  region: "",
  amenities: "",
  roomStyleSummary: "",
  photos: "",
  trustSummary: "",
});

export const createEmptyPartnerInventoryDraft = () => ({
  roomInventory: [],
  availabilityCalendar: [],
  inventorySettings: {
    autoExtendCalendar: false,
    monthsAhead: 3,
    defaultCurrency: "USD",
    defaultStatus: "open",
    checkInCutoffDays: 0,
  },
});

export const createEmptyPartnerChannelDraft = () => ({
  checkoutSettings: {
    currency: "USD",
    taxPercent: 0,
    serviceFeePercent: 0,
    cleaningFee: 0,
    depositPercent: 100,
    allowPayNow: true,
    instantBookable: false,
    cancellationPolicy: "",
    checkInTime: "",
    checkOutTime: "",
  },
  channelConnections: [],
});

export const createEmptyPartnerRequestDraft = () => ({
  status: "confirmed",
  reservationCode: "",
  notes: "",
});

const splitList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const buildPartnerHotelUpdatePayload = (draft = {}) => ({
  name: String(draft.name || "").trim(),
  summary: String(draft.summary || "").trim(),
  description: String(draft.description || "").trim(),
  destination: String(draft.destination || "").trim(),
  region: String(draft.region || "").trim(),
  amenities: splitList(draft.amenities),
  roomStyleSummary: String(draft.roomStyleSummary || "").trim(),
  photos: splitList(draft.photos),
  trustSummary: String(draft.trustSummary || "").trim(),
});

const toOptionalNumber = (value) => {
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const buildPartnerInventoryPayload = (draft = {}) => ({
  roomInventory: (Array.isArray(draft.roomInventory) ? draft.roomInventory : [])
    .map((entry = {}) => {
      const roomTypeCode = String(entry.roomTypeCode || "").trim().toLowerCase();
      const label = String(entry.label || "").trim();
      if (!roomTypeCode || !label) {
        return null;
      }

      return {
        roomTypeCode,
        label,
        capacity: Number(toOptionalNumber(entry.capacity) || 0),
        totalUnits: Number(toOptionalNumber(entry.totalUnits) || 0),
        baseNightlyRate: toOptionalNumber(entry.baseNightlyRate),
        currency: String(entry.currency || "USD").trim().toUpperCase() || "USD",
        boardBasis: String(entry.boardBasis || "").trim(),
        active: entry.active !== false,
      };
    })
    .filter(Boolean),
  availabilityCalendar: (Array.isArray(draft.availabilityCalendar) ? draft.availabilityCalendar : [])
    .map((entry = {}) => {
      const date = String(entry.date || "").trim();
      const roomTypeCode = String(entry.roomTypeCode || "").trim().toLowerCase();
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
        currency: String(entry.currency || "").trim().toUpperCase(),
        minStay: Number(toOptionalNumber(entry.minStay) || 1),
        note: String(entry.note || "").trim(),
      };
    })
    .filter(Boolean),
  inventorySettings: {
    autoExtendCalendar: draft.inventorySettings?.autoExtendCalendar === true,
    monthsAhead: Number(toOptionalNumber(draft.inventorySettings?.monthsAhead) || 3),
    defaultCurrency:
      String(draft.inventorySettings?.defaultCurrency || "USD").trim().toUpperCase() || "USD",
    defaultStatus: ["open", "limited", "sold-out", "on-request", "closed"].includes(
      draft.inventorySettings?.defaultStatus
    )
      ? draft.inventorySettings.defaultStatus
      : "open",
    checkInCutoffDays: Number(toOptionalNumber(draft.inventorySettings?.checkInCutoffDays) || 0),
  },
});

export const buildPartnerAccommodationResponsePayload = (draft = {}) => ({
  status: ["pending", "confirmed", "cancelled"].includes(draft.status)
    ? draft.status
    : "confirmed",
  reservationCode: String(draft.reservationCode || "").trim(),
  notes: String(draft.notes || "").trim(),
});

export const buildPartnerChannelPayload = (draft = {}) => ({
  checkoutSettings: {
    currency: String(draft.checkoutSettings?.currency || "USD").trim().toUpperCase() || "USD",
    taxPercent: Number(toOptionalNumber(draft.checkoutSettings?.taxPercent) || 0),
    serviceFeePercent: Number(toOptionalNumber(draft.checkoutSettings?.serviceFeePercent) || 0),
    cleaningFee: Number(toOptionalNumber(draft.checkoutSettings?.cleaningFee) || 0),
    depositPercent: Number(toOptionalNumber(draft.checkoutSettings?.depositPercent) || 100),
    allowPayNow: draft.checkoutSettings?.allowPayNow !== false,
    instantBookable: draft.checkoutSettings?.instantBookable === true,
    cancellationPolicy: String(draft.checkoutSettings?.cancellationPolicy || "").trim(),
    checkInTime: String(draft.checkoutSettings?.checkInTime || "").trim(),
    checkOutTime: String(draft.checkoutSettings?.checkOutTime || "").trim(),
  },
  channelConnections: (Array.isArray(draft.channelConnections) ? draft.channelConnections : [])
    .map((connection = {}) => {
      const provider = String(connection.provider || "").trim().toLowerCase();
      if (!provider) {
        return null;
      }

      return {
        provider,
        status: String(connection.status || "draft").trim().toLowerCase() || "draft",
        externalHotelId: String(connection.externalHotelId || "").trim(),
        syncMode: String(connection.syncMode || "pull").trim().toLowerCase() || "pull",
        syncInventory: connection.syncInventory !== false,
        syncRates: connection.syncRates !== false,
        syncRestrictions: connection.syncRestrictions === true,
        credentialSummary: String(connection.credentialSummary || "").trim(),
        note: String(connection.note || "").trim(),
        lastSyncAt: connection.lastSyncAt || null,
        lastSyncStatus: String(connection.lastSyncStatus || "idle").trim().toLowerCase(),
        lastSyncMessage: String(connection.lastSyncMessage || "").trim(),
        lastSyncDirection: String(connection.lastSyncDirection || "").trim().toLowerCase(),
        lastSyncSnapshot: connection.lastSyncSnapshot || {},
      };
    })
    .filter(Boolean),
});

export const filterPartnerHotels = (hotels = [], search = "") => {
  const needle = String(search || "").trim().toLowerCase();

  if (!needle) {
    return hotels;
  }

  return hotels.filter((hotel = {}) =>
    [hotel.name, hotel.destination, hotel.region]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle))
  );
};

export const filterPartnerAccommodationRequests = (requests = [], filters = {}) => {
  const search = String(filters.search || "").trim().toLowerCase();
  const status = String(filters.status || "").trim();

  return requests.filter((request = {}) => {
    if (status && request.status !== status) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      request.bookingGuestName,
      request.hotelName,
      request.assignedTourTitle,
      request.reservationCode,
      request.roomPlan,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
};

export const filterPartnerInventoryEntries = (entries = [], filters = {}) => {
  const search = String(filters.search || "").trim().toLowerCase();
  const status = String(filters.status || "").trim();

  return entries.filter((entry = {}) => {
    if (status && entry.status !== status) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [entry.roomTypeCode, entry.label, entry.note]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
};
