import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantDiscoveryQuery,
  shapeRestaurantDetail,
  shapeRestaurantDiscoveryCard,
} from "../utils/restaurantMarketplace.js";

test("shapeRestaurantDiscoveryCard exposes public restaurant trust and fit fields", () => {
  const card = shapeRestaurantDiscoveryCard({
    _id: "restaurant-1",
    name: "Savanna Table",
    slug: "savanna-table",
    summary: "A dining room for late safari dinners.",
    destination: "Arusha",
    cuisineTypes: ["tanzanian", "grill"],
    mealTypes: ["dinner"],
    dietaryFits: ["vegetarian"],
    ambianceTags: ["romantic"],
    averageRating: 4.7,
    reviewCount: 18,
    sponsoredPlacement: true,
    tenantId: { _id: "tenant-1", name: "Maz Expeditions", slug: "maz-expeditions" },
  });

  assert.equal(card._id, "restaurant-1");
  assert.equal(card.operator.name, "Maz Expeditions");
  assert.equal(card.trust.reviewLabel, "4.7/5 from 18 reviews");
  assert.equal(card.fitTags.includes("Tanzanian"), true);
  assert.equal(card.sponsoredPlacement, true);
});

test("shapeRestaurantDiscoveryCard includes operator credibility and dining context", () => {
  const card = shapeRestaurantDiscoveryCard({
    _id: "restaurant-1",
    name: "Savanna Table",
    cuisineTypes: ["Tanzanian"],
    mealTypes: ["Dinner"],
    ambianceTags: ["Romantic"],
    tenantId: { _id: "tenant-1", name: "Maz Expeditions", slug: "maz-expeditions" },
  });

  assert.equal(card.operator.name, "Maz Expeditions");
  assert.equal(card.trust.operatorLabel.includes("Operator"), true);
  assert.equal(card.diningContextLabel.includes("Dinner"), true);
});

test("shapeRestaurantDetail keeps inquiry and itinerary intent context explicit", () => {
  const detail = shapeRestaurantDetail({
    _id: "restaurant-1",
    name: "Savanna Table",
    slug: "savanna-table",
    destination: "Arusha",
    cuisineTypes: ["tanzanian"],
    tenantId: { _id: "tenant-1", name: "Maz Expeditions", slug: "maz-expeditions" },
  });

  assert.equal(detail.conversion.sendInquiry.restaurantId, "restaurant-1");
  assert.equal(detail.conversion.requestInItinerary.restaurantIntentType, "itinerary-add-on");
  assert.equal(detail.aiConcierge.groundingWarning.includes("reservations"), true);
});

test("shapeRestaurantDetail includes operator credibility and dining reassurance blocks", () => {
  const detail = shapeRestaurantDetail({
    _id: "restaurant-1",
    name: "Savanna Table",
    mealTypes: ["Dinner"],
    dietaryFits: ["Vegetarian"],
    tenantId: { _id: "tenant-1", name: "Maz Expeditions", slug: "maz-expeditions" },
  });

  assert.equal(detail.trustModules.operatorCredibility.title, "Operator credibility");
  assert.equal(detail.trustModules.diningReassurance.items.length > 0, true);
});

test("buildRestaurantDiscoveryQuery filters only published marketplace-visible restaurants", () => {
  const query = buildRestaurantDiscoveryQuery({
    q: "grill",
    destination: "Arusha",
    cuisine: "tanzanian",
    mealType: "dinner",
    dietaryFit: "vegetarian",
    ambiance: "romantic",
  });

  assert.equal(query.published, true);
  assert.equal(query.marketplaceVisible, true);
  assert.equal(query.destination.$regex.test("Arusha"), true);
  assert.equal(query.cuisineTypes.$regex.test("Tanzanian"), true);
  assert.equal(query.mealTypes.$regex.test("Dinner"), true);
  assert.equal(Array.isArray(query.$or), true);
});
