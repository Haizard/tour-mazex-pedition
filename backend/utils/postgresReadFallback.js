const asArray = (value) => (Array.isArray(value) ? value : []);

export const preferPrimaryCollection = (primaryRows = [], legacyRows = []) => {
  const normalizedPrimary = asArray(primaryRows);
  const normalizedLegacy = asArray(legacyRows);

  if (normalizedPrimary.length === 0 && normalizedLegacy.length > 0) {
    return normalizedLegacy;
  }

  return normalizedPrimary;
};

export const preferPrimaryDashboard = (
  primaryPayload = {},
  legacyPayload = {},
  collectionKey = "items"
) => {
  const primaryRows = asArray(primaryPayload?.[collectionKey]);
  const legacyRows = asArray(legacyPayload?.[collectionKey]);

  if (primaryRows.length === 0 && legacyRows.length > 0) {
    return legacyPayload;
  }

  return primaryPayload;
};
