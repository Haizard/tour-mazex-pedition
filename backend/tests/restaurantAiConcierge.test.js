import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantConciergeRecommendations,
  buildRestaurantConciergeRequest,
} from "../utils/restaurantAiConcierge.js";

test("buildRestaurantConciergeRequest normalizes traveler dining preference inputs", () => {
  const request = buildRestaurantConciergeRequest({
    destination: " Arusha ",
    mealType: " Dinner ",
    cuisineTypes: [" Grill ", "", "Tanzanian"],
    dietaryFits: [" Vegetarian "],
    ambianceTags: [" Romantic "],
    tripIntent: "itinerary-add-on",
  });

  assert.deepEqual(request, {
    destination: "arusha",
    mealType: "dinner",
    cuisineTypes: ["grill", "tanzanian"],
    dietaryFits: ["vegetarian"],
    ambianceTags: ["romantic"],
    tripIntent: "itinerary-add-on",
  });
});

test("buildRestaurantConciergeRecommendations ranks only public restaurants using grounded fields", () => {
  const recommendations = buildRestaurantConciergeRecommendations(
    [
      {
        _id: "restaurant-1",
        name: "Savanna Table",
        slug: "savanna-table",
        destination: "Arusha",
        cuisineTypes: ["Tanzanian", "Grill"],
        mealTypes: ["Dinner"],
        dietaryFits: ["Vegetarian"],
        ambianceTags: ["Romantic"],
        averageRating: 4.7,
        reviewCount: 18,
        published: true,
        marketplaceVisible: true,
      },
      {
        _id: "restaurant-2",
        name: "City Lunch Bar",
        slug: "city-lunch-bar",
        destination: "Nairobi",
        cuisineTypes: ["Cafe"],
        mealTypes: ["Lunch"],
        published: true,
        marketplaceVisible: true,
      },
      {
        _id: "restaurant-3",
        name: "Hidden Draft Dining",
        destination: "Arusha",
        cuisineTypes: ["Grill"],
        mealTypes: ["Dinner"],
        published: false,
        marketplaceVisible: true,
      },
    ],
    {
      destination: "Arusha",
      mealType: "Dinner",
      cuisineTypes: ["grill"],
      dietaryFits: ["vegetarian"],
      ambianceTags: ["romantic"],
    }
  );

  assert.equal(recommendations.length, 2);
  assert.equal(recommendations[0].restaurantId, "restaurant-1");
  assert.equal(recommendations[0].fitScore > recommendations[1].fitScore, true);
  assert.equal(recommendations.some((item) => item.restaurantId === "restaurant-3"), false);
  assert.equal(recommendations[0].guardrail.includes("reservations"), true);
});
