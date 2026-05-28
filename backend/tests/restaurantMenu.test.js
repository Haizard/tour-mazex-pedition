import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMenuItemSnapshot,
  buildMenuPreorderMetadata,
  buildRestaurantMenuAiSummary,
  normalizeMenuItemPayload,
  normalizeMenuSectionPayload,
  shapePublicRestaurantMenuPreview,
} from "../utils/restaurantMenu.js";

test("normalizes menu sections and items for restaurant-owned menus", () => {
  assert.deepEqual(normalizeMenuSectionPayload({ title: " Group Platters ", displayOrder: "2" }), {
    title: "Group Platters",
    description: "",
    displayOrder: 2,
    status: "active",
  });

  const item = normalizeMenuItemPayload({
    name: "  Safari Sharing Platter ",
    description: "Feeds a small group",
    price: "45",
    currency: "usd",
    dietaryTags: [" Halal ", "", "Vegetarian"],
    allergenTags: [" nuts "],
    featured: true,
    groupFriendly: true,
    preorderEnabled: true,
    minGuests: "4",
    maxGuests: "12",
  });

  assert.equal(item.name, "Safari Sharing Platter");
  assert.equal(item.price, 45);
  assert.equal(item.currency, "USD");
  assert.deepEqual(item.dietaryTags, ["Halal", "Vegetarian"]);
  assert.deepEqual(item.allergenTags, ["nuts"]);
  assert.equal(item.groupFriendly, true);
  assert.equal(item.preorderEnabled, true);
  assert.equal(item.minGuests, 4);
  assert.equal(item.maxGuests, 12);
});

test("shapes public menu preview with trust-safe disclaimer", () => {
  const preview = shapePublicRestaurantMenuPreview({
    sections: [{ _id: "section_1", title: "Mains", status: "active", displayOrder: 1 }],
    items: [
      {
        _id: "item_1",
        sectionId: "section_1",
        name: "Coconut Fish Curry",
        description: "Coastal curry",
        price: 18,
        currency: "USD",
        dietaryTags: ["Gluten aware"],
        available: true,
        featured: true,
        groupFriendly: false,
        preorderEnabled: true,
        status: "active",
      },
      { _id: "hidden", name: "Hidden", available: false, status: "archived" },
    ],
  });

  assert.equal(preview.sections.length, 1);
  assert.equal(preview.items.length, 1);
  assert.equal(preview.featuredItems[0].name, "Coconut Fish Curry");
  assert.equal(preview.disclaimer.includes("confirmed by the restaurant/operator"), true);
});

test("builds reservation menu snapshots and preorder metadata", () => {
  const item = {
    _id: "item_1",
    name: "Private Dining Menu",
    price: 65,
    currency: "USD",
    dietaryTags: ["Vegetarian"],
    allergenTags: ["nuts"],
    preorderEnabled: true,
  };

  assert.deepEqual(buildMenuItemSnapshot(item), {
    itemId: "item_1",
    name: "Private Dining Menu",
    price: 65,
    currency: "USD",
    dietaryTags: ["Vegetarian"],
    allergenTags: ["nuts"],
    preorderEnabled: true,
  });

  assert.deepEqual(
    buildMenuPreorderMetadata({
      selectedMenuItemIds: ["item_1"],
      groupMealNotes: "Birthday group",
      preorderInterest: true,
    }),
    {
      selectedMenuItemIds: ["item_1"],
      groupMealNotes: "Birthday group",
      preorderInterest: true,
      preorderReason: "group_dining",
    }
  );
});

test("buildRestaurantMenuAiSummary does not fabricate menu facts", () => {
  const summary = buildRestaurantMenuAiSummary({
    items: [{ name: "Vegetarian Pilau", dietaryTags: ["Vegetarian"], groupFriendly: true }],
  });

  assert.equal(summary.highlights.includes("Vegetarian Pilau"), true);
  assert.equal(summary.trustBoundary.includes("does not confirm dish availability"), true);
});
