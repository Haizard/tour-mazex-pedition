const PROVIDERS = new Set(["manual", "siteminder", "cloudbeds", "little-hotelier", "booking-com"]);
const SYNC_MODES = new Set(["pull", "push", "bidirectional"]);
const STATUSES = new Set(["draft", "connected", "paused", "error"]);

const clean = (value = "") => String(value || "").trim();

const toBoolean = (value, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

export const normalizeHotelChannelConnections = (connections = []) =>
  (Array.isArray(connections) ? connections : [])
    .map((connection = {}) => {
      const provider = clean(connection.provider).toLowerCase();
      if (!PROVIDERS.has(provider)) {
        return null;
      }

      const status = clean(connection.status).toLowerCase();
      const syncMode = clean(connection.syncMode).toLowerCase();

      return {
        provider,
        status: STATUSES.has(status) ? status : "draft",
        externalHotelId: clean(connection.externalHotelId),
        syncMode: SYNC_MODES.has(syncMode) ? syncMode : "pull",
        syncInventory: toBoolean(connection.syncInventory, true),
        syncRates: toBoolean(connection.syncRates, true),
        syncRestrictions: toBoolean(connection.syncRestrictions, false),
        credentialSummary: clean(connection.credentialSummary),
        note: clean(connection.note),
        lastSyncAt: connection.lastSyncAt || null,
        lastSyncStatus: clean(connection.lastSyncStatus).toLowerCase() || "idle",
        lastSyncMessage: clean(connection.lastSyncMessage),
        lastSyncDirection: clean(connection.lastSyncDirection).toLowerCase(),
        lastSyncSnapshot: connection.lastSyncSnapshot || {},
      };
    })
    .filter(Boolean);

export const buildHotelChannelSyncResult = ({
  hotel = {},
  provider = "manual",
  direction = "pull",
} = {}) => {
  const roomTypes = Array.isArray(hotel.roomInventory) ? hotel.roomInventory.length : 0;
  const dateRows = Array.isArray(hotel.availabilityCalendar) ? hotel.availabilityCalendar.length : 0;
  return {
    lastSyncAt: new Date(),
    lastSyncStatus: "success",
    lastSyncDirection: direction,
    lastSyncMessage:
      direction === "push"
        ? `Pushed ${roomTypes} room types and ${dateRows} dated entries to ${provider}.`
        : `Pulled ${roomTypes} room types and ${dateRows} dated entries from ${provider}.`,
    lastSyncSnapshot: {
      roomTypeCount: roomTypes,
      availabilityEntryCount: dateRows,
      hotelName: hotel.name || "",
    },
  };
};
