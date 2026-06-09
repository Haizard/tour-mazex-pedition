import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMenuSelectionPayload,
  getMenuEmptyState,
  getMenuSectionItems,
  normalizeRestaurantMenuPreview,
} from "./restaurantMenuState.js";

test("normalizes public restaurant menu preview safely", () => {
  const preview = normalizeRestaurantMenuPreview({
    items: [
      {
        id: "item_1",
        name: "Coconut Fish Curry",
        price: 18,
        currency: "USD",
        featured: true,
        dietaryTags: ["Gluten aware"],
      },
      null,
    ],
    disclaimer: "Menu availability is confirmed by the operator.",
  });

  assert.equal(preview.items.length, 1);
  assert.equal(preview.items[0].priceLabel, "USD 18");
  assert.equal(preview.featuredItems[0].name, "Coconut Fish Curry");
  assert.equal(preview.disclaimer, "Menu availability is confirmed by the operator.");
});

test("normalizes items with missing fields gracefully", () => {
  const preview = normalizeRestaurantMenuPreview({
    items: [{ id: "", price: 0, name: "Test Dish" }],
  });

  assert.equal(preview.items.length, 1);
  assert.equal(preview.items[0].priceLabel, "Price on confirmation");
});

test("buildMenuSelectionPayload shapes reservation menu interest", () => {
  const payload = buildMenuSelectionPayload({
    selectedMenuItemIds: ["item_1", "", "item_2"],
    groupMealNotes: "Birthday dinner",
    preorderInterest: true,
  });

  assert.deepEqual(payload.selectedMenuItemIds, ["item_1", "item_2"]);
  assert.equal(payload.groupMealNotes, "Birthday dinner");
  assert.equal(payload.preorderInterest, true);
});

test("buildMenuSelectionPayload handles empty selections", () => {
  const payload = buildMenuSelectionPayload({});

  assert.deepEqual(payload.selectedMenuItemIds, []);
  assert.equal(payload.groupMealNotes, "");
  assert.equal(payload.preorderInterest, false);
});

test("getMenuEmptyState explains missing menus without inventing dishes", () => {
  assert.equal(getMenuEmptyState().includes("not published"), true);
});

test("getMenuSectionItems groups items by section", () => {
  const sections = [
    { id: "section_1", title: "Starters" },
    { id: "section_2", title: "Mains" },
  ];
  const items = [
    { sectionId: "section_1", name: "Samosas" },
    { sectionId: "section_2", name: "Curry" },
    { sectionId: "section_2", name: "Rice" },
  ];

  const result = getMenuSectionItems(sections, items);
  assert.equal(result[0].items.length, 1);
  assert.equal(result[1].items.length, 2);
});
