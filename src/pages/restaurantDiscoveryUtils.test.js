import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantIntentOptions,
  countActiveRestaurantFilters,
  filterRestaurantCards,
  sortRestaurantCards,
} from "./restaurantDiscoveryUtils.js";

test("filterRestaurantCards filters by search and cuisine", () => {
  const rows = filterRestaurantCards(
    [
      { name: "Savanna Table", destination: "Arusha", cuisineTypes: ["Tanzanian"] },
      { name: "City Brunch", destination: "Nairobi", cuisineTypes: ["Cafe"] },
    ],
    { q: "savanna", cuisine: "tanzanian" }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Savanna Table");
});

test("sortRestaurantCards prefers sponsored then rating on featured", () => {
  const rows = sortRestaurantCards(
    [
      { name: "A", sponsoredPlacement: false, averageRating: 5 },
      { name: "B", sponsoredPlacement: true, averageRating: 4 },
    ],
    "featured"
  );

  assert.equal(rows[0].name, "B");
});

test("countActiveRestaurantFilters counts non-empty filters", () => {
  assert.equal(
    countActiveRestaurantFilters({ q: "a", destination: "b", cuisine: "", mealType: "dinner" }),
    3
  );
});

test("buildRestaurantIntentOptions keeps both direct and itinerary paths", () => {
  const options = buildRestaurantIntentOptions({
    _id: "restaurant-1",
    name: "Savanna Table",
    destination: "Arusha",
    operator: { id: "tenant-1", slug: "maz-expeditions" },
  });

  assert.equal(options.length, 2);
  assert.equal(options[0].payload.restaurantIntentType, "direct-restaurant");
  assert.equal(options[1].payload.restaurantIntentType, "itinerary-add-on");
});
