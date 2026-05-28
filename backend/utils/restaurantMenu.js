const RECORD_STATUSES = new Set(["active", "paused", "archived"]);

const toTrimmedString = (value) => String(value || "").trim();
const toStringArray = (value) =>
  Array.isArray(value) ? value.map((item) => toTrimmedString(item)).filter(Boolean) : [];

const toNonNegativeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const toPositiveInt = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeStatus = (value) => {
  const status = toTrimmedString(value).toLowerCase();
  return RECORD_STATUSES.has(status) ? status : "active";
};

const toId = (value) => String(value?._id || value?.id || value || "");

export const normalizeMenuSectionPayload = (payload = {}) => ({
  title: toTrimmedString(payload.title),
  description: toTrimmedString(payload.description),
  displayOrder: toPositiveInt(payload.displayOrder, 0),
  status: normalizeStatus(payload.status),
});

export const normalizeMenuItemPayload = (payload = {}) => {
  const minGuests = toPositiveInt(payload.minGuests, 1);
  const maxGuests = Math.max(toPositiveInt(payload.maxGuests, minGuests), minGuests);

  return {
    sectionId: payload.sectionId || null,
    name: toTrimmedString(payload.name),
    description: toTrimmedString(payload.description),
    price: toNonNegativeNumber(payload.price, 0),
    currency: toTrimmedString(payload.currency || "USD").toUpperCase(),
    dietaryTags: toStringArray(payload.dietaryTags),
    allergenTags: toStringArray(payload.allergenTags),
    photo: toTrimmedString(payload.photo),
    available: payload.available !== false,
    featured: payload.featured === true,
    groupFriendly: payload.groupFriendly === true,
    preorderEnabled: payload.preorderEnabled === true,
    minGuests,
    maxGuests,
    status: normalizeStatus(payload.status),
  };
};

export const buildMenuItemSnapshot = (item = {}) => ({
  itemId: toId(item),
  name: item.name || "",
  price: toNonNegativeNumber(item.price, 0),
  currency: item.currency || "USD",
  dietaryTags: toStringArray(item.dietaryTags),
  allergenTags: toStringArray(item.allergenTags),
  preorderEnabled: item.preorderEnabled === true,
});

export const buildMenuPreorderMetadata = (payload = {}) => {
  const selectedMenuItemIds = toStringArray(payload.selectedMenuItemIds);
  const groupMealNotes = toTrimmedString(payload.groupMealNotes);
  const preorderInterest = payload.preorderInterest === true;

  return {
    selectedMenuItemIds,
    groupMealNotes,
    preorderInterest,
    preorderReason:
      preorderInterest || groupMealNotes || selectedMenuItemIds.length ? "group_dining" : "none",
  };
};

const shapeSection = (section = {}) => ({
  id: toId(section),
  title: section.title || "",
  description: section.description || "",
  displayOrder: Number(section.displayOrder || 0),
});

const shapeItem = (item = {}) => ({
  id: toId(item),
  sectionId: item.sectionId ? String(item.sectionId) : null,
  name: item.name || "",
  description: item.description || "",
  price: toNonNegativeNumber(item.price, 0),
  currency: item.currency || "USD",
  dietaryTags: toStringArray(item.dietaryTags),
  allergenTags: toStringArray(item.allergenTags),
  photo: item.photo || "",
  available: item.available !== false,
  featured: item.featured === true,
  groupFriendly: item.groupFriendly === true,
  preorderEnabled: item.preorderEnabled === true,
  minGuests: toPositiveInt(item.minGuests, 1),
  maxGuests: toPositiveInt(item.maxGuests, 1),
});

export const shapePublicRestaurantMenuPreview = ({ sections = [], items = [] } = {}) => {
  const activeSections = (Array.isArray(sections) ? sections : [])
    .filter((section) => (section.status || "active") === "active")
    .map(shapeSection)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title));

  const activeItems = (Array.isArray(items) ? items : [])
    .filter((item) => (item.status || "active") === "active" && item.available !== false)
    .map(shapeItem)
    .filter((item) => item.id && item.name);

  return {
    sections: activeSections,
    items: activeItems,
    featuredItems: activeItems.filter((item) => item.featured).slice(0, 6),
    groupFriendlyItems: activeItems.filter((item) => item.groupFriendly).slice(0, 6),
    preorderItems: activeItems.filter((item) => item.preorderEnabled).slice(0, 6),
    disclaimer: "Menu availability and final pricing are confirmed by the restaurant/operator.",
  };
};

export const buildRestaurantMenuAiSummary = ({ items = [] } = {}) => {
  const activeItems = (Array.isArray(items) ? items : []).filter((item) => item && item.name);
  const groupItems = activeItems.filter((item) => item.groupFriendly).map((item) => item.name);
  const dietaryTags = [...new Set(activeItems.flatMap((item) => toStringArray(item.dietaryTags)))];

  return {
    highlights: activeItems.slice(0, 4).map((item) => item.name),
    groupDiningFit: groupItems.length
      ? `Group-friendly options include ${groupItems.slice(0, 3).join(", ")}.`
      : "No group-friendly menu items have been marked yet.",
    dietarySummary: dietaryTags.length
      ? `Known dietary tags include ${dietaryTags.slice(0, 5).join(", ")}.`
      : "No dietary tags have been stored yet.",
    trustBoundary:
      "AI guidance uses stored menu fields only and does not confirm dish availability, allergen guarantees, live kitchen capacity, or final pricing.",
  };
};
