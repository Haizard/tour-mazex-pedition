const toTrimmedString = (value) => String(value || "").trim();
const toStringArray = (value) =>
  Array.isArray(value)
    ? value.map((item) => toTrimmedString(item)).filter(Boolean)
    : [];

const normalizeItem = (item = {}, index = 0) => ({
  id: item.id || item._id || `restaurant-menu-item-${index}`,
  name: item.name || "Menu item",
  description: item.description || "",
  price: Number(item.price || 0),
  currency: item.currency || "USD",
  priceLabel:
    Number(item.price || 0) > 0
      ? `${item.currency || "USD"} ${Number(item.price || 0)}`
      : "Price on confirmation",
  dietaryTags: toStringArray(item.dietaryTags),
  allergenTags: toStringArray(item.allergenTags),
  featured: item.featured === true,
  groupFriendly: item.groupFriendly === true,
  preorderEnabled: item.preorderEnabled === true,
});

export const normalizeRestaurantMenuPreview = (preview = {}) => {
  const items = (Array.isArray(preview.items) ? preview.items : [])
    .filter((item) => item && typeof item === "object")
    .map(normalizeItem)
    .filter((item) => item.name);

  return {
    sections: Array.isArray(preview.sections) ? preview.sections : [],
    items,
    featuredItems: items.filter((item) => item.featured).slice(0, 6),
    groupFriendlyItems: items.filter((item) => item.groupFriendly).slice(0, 6),
    preorderItems: items.filter((item) => item.preorderEnabled).slice(0, 6),
    disclaimer:
      preview.disclaimer ||
      "Menu availability and final pricing are confirmed by the restaurant/operator.",
  };
};

export const buildMenuSelectionPayload = (selection = {}) => ({
  selectedMenuItemIds: toStringArray(selection.selectedMenuItemIds),
  groupMealNotes: toTrimmedString(selection.groupMealNotes),
  preorderInterest: selection.preorderInterest === true,
});

export const getMenuEmptyState = () =>
  "This restaurant has not published a structured menu yet. The operator can still confirm dining details after inquiry.";

export const getMenuSectionItems = (sections = [], items = []) =>
  sections.map((section) => ({
    ...section,
    items: items.filter(
      (item) => String(item.sectionId) === String(section.id || section._id)
    ),
  }));
