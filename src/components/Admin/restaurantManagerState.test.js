import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantPayload,
  createEmptyRestaurantDraft,
  filterRestaurantRows,
} from "./restaurantManagerState.js";

test("createEmptyRestaurantDraft starts with draft defaults", () => {
  const draft = createEmptyRestaurantDraft();

  assert.equal(draft.status, "draft");
  assert.equal(draft.published, false);
});

test("buildRestaurantPayload normalizes comma and line-break lists", () => {
  const payload = buildRestaurantPayload({
    name: "Savanna Table",
    slug: "savanna-table",
    cuisineTypesText: "Tanzanian, Grill",
    mealTypesText: "Dinner\nLunch",
    dietaryFitsText: "Vegetarian, Halal",
    ambianceTagsText: "Romantic, Local",
  });

  assert.deepEqual(payload.cuisineTypes, ["Tanzanian", "Grill"]);
  assert.deepEqual(payload.mealTypes, ["Dinner", "Lunch"]);
  assert.deepEqual(payload.dietaryFits, ["Vegetarian", "Halal"]);
});

test("filterRestaurantRows supports search and status filters", () => {
  const rows = filterRestaurantRows(
    [
      { name: "Savanna Table", destination: "Arusha", cuisineTypes: ["Tanzanian"], published: true, marketplaceVisible: true, sponsoredPlacement: true },
      { name: "Draft Dining", destination: "Moshi", cuisineTypes: ["Cafe"], published: false, marketplaceVisible: false, sponsoredPlacement: false },
    ],
    { search: "arusha", status: "public" }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Savanna Table");
});
