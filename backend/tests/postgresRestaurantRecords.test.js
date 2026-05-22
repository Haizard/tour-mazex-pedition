import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantRecord,
  buildRestaurantRecordView,
} from "../utils/postgresRestaurantRecords.js";

test("buildRestaurantRecord keeps cuisine and dietary fields", () => {
  const record = buildRestaurantRecord({
    _id: "restaurant-1",
    tenantId: "tenant-1",
    name: "Kilimanjaro Flame Grill",
    cuisineTypes: ["tanzanian", "grill"],
    dietaryFits: ["vegetarian"],
  });

  assert.equal(record.sourceId, "restaurant-1");
  assert.deepEqual(record.cuisineTypes, ["tanzanian", "grill"]);
  assert.deepEqual(record.dietaryFits, ["vegetarian"]);
});

test("buildRestaurantRecordView reconstructs a restaurant payload", () => {
  const view = buildRestaurantRecordView({
    source_id: "restaurant-1",
    tenant_id: "tenant-1",
    name: "Kilimanjaro Flame Grill",
    cuisine_types: ["tanzanian", "grill"],
    meal_types: ["dinner"],
    dietary_fits: ["vegetarian"],
  });

  assert.equal(view._id, "restaurant-1");
  assert.deepEqual(view.cuisineTypes, ["tanzanian", "grill"]);
  assert.deepEqual(view.mealTypes, ["dinner"]);
});
