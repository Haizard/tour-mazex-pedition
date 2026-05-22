import { TRAVELER_AUTH_TOKEN_KEY } from "./travelerGooglePromptState.js";

export const TRAVELER_PROFILE_KEY = "travelerProfile";

const isStorageAvailable = (storage) =>
  storage &&
  typeof storage.getItem === "function" &&
  typeof storage.setItem === "function" &&
  typeof storage.removeItem === "function";

export const normalizeTravelerProfile = (traveler = {}) => {
  if (!traveler || typeof traveler !== "object") {
    return null;
  }

  const email = String(traveler.email || "").trim().toLowerCase();
  const displayName = String(traveler.displayName || "").trim();

  if (!email && !displayName) {
    return null;
  }

  return {
    id: String(traveler.id || "").trim(),
    email,
    displayName,
    avatarUrl: String(traveler.avatarUrl || "").trim(),
    authProvider: String(traveler.authProvider || "").trim(),
  };
};

export const readStoredTravelerSession = (storage) => {
  if (!isStorageAvailable(storage)) {
    return { token: "", traveler: null };
  }

  const token = storage.getItem(TRAVELER_AUTH_TOKEN_KEY) || "";
  const rawProfile = storage.getItem(TRAVELER_PROFILE_KEY) || "";

  if (!rawProfile) {
    return { token, traveler: null };
  }

  try {
    return {
      token,
      traveler: normalizeTravelerProfile(JSON.parse(rawProfile)),
    };
  } catch (_error) {
    storage.removeItem(TRAVELER_PROFILE_KEY);
    return { token, traveler: null };
  }
};

export const persistTravelerSession = ({ token = "", traveler = null } = {}, storage) => {
  if (!isStorageAvailable(storage)) {
    return;
  }

  const normalizedTraveler = normalizeTravelerProfile(traveler);

  if (token) {
    storage.setItem(TRAVELER_AUTH_TOKEN_KEY, token);
  } else {
    storage.removeItem(TRAVELER_AUTH_TOKEN_KEY);
  }

  if (normalizedTraveler) {
    storage.setItem(TRAVELER_PROFILE_KEY, JSON.stringify(normalizedTraveler));
  } else {
    storage.removeItem(TRAVELER_PROFILE_KEY);
  }
};

export const clearTravelerSession = (storage) => {
  if (!isStorageAvailable(storage)) {
    return;
  }

  storage.removeItem(TRAVELER_AUTH_TOKEN_KEY);
  storage.removeItem(TRAVELER_PROFILE_KEY);
};

export const getTravelerDisplayName = (traveler = {}) => {
  const displayName = String(traveler?.displayName || "").trim();
  if (displayName) {
    return displayName;
  }

  const email = String(traveler?.email || "").trim();
  if (email) {
    return email.split("@")[0] || "Traveler";
  }

  return "Traveler";
};

export const getTravelerInitials = (traveler = {}) => {
  const label = getTravelerDisplayName(traveler);
  const parts = label
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0]?.[0] || "T").toUpperCase();
};
