const STORAGE_KEY = "marketplaceTravelerSessionKey";

export const getMarketplaceTravelerSessionKey = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = `traveler_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
};

