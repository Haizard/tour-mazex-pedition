import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantAnalyticsCards,
  buildRestaurantRecentActivity,
  buildRestaurantSponsoredSpotlight,
} from "./restaurantAnalyticsState.js";

test("buildRestaurantAnalyticsCards maps summary metrics into cards", () => {
  const cards = buildRestaurantAnalyticsCards({
    summary: {
      publicRestaurants: 4,
      sponsoredRestaurants: 2,
      totalRestaurantLeads: 9,
      directRestaurantLeads: 5,
      itineraryRestaurantLeads: 4,
    },
  });

  assert.equal(cards.length >= 4, true);
  assert.equal(cards[0].value, 4);
  assert.equal(cards[3].value, "5 / 4");
});

test("buildRestaurantSponsoredSpotlight separates top and low sponsored performers", () => {
  const spotlight = buildRestaurantSponsoredSpotlight([
    { restaurantId: "a", restaurantName: "A", sponsoredPlacement: true, demandScore: 30 },
    { restaurantId: "b", restaurantName: "B", sponsoredPlacement: true, demandScore: 10 },
    { restaurantId: "c", restaurantName: "C", sponsoredPlacement: false, demandScore: 50 },
  ]);

  assert.equal(spotlight.top[0].restaurantName, "A");
  assert.equal(spotlight.watch[0].restaurantName, "B");
});

test("buildRestaurantRecentActivity prefers payload activity and falls back to restaurant recency", () => {
  const activity = buildRestaurantRecentActivity({
    recentActivity: [
      {
        restaurantId: "a",
        restaurantName: "Savanna Table",
        activityLabel: "Direct restaurant inquiry",
        occurredAt: "2026-05-22T08:30:00.000Z",
      },
    ],
    restaurants: [
      {
        restaurantId: "b",
        restaurantName: "Coast Spice House",
        inquiryCount: 2,
        lastInquiryAt: "2026-05-21T08:30:00.000Z",
      },
    ],
  });

  assert.equal(activity[0].restaurantId, "a");

  const fallbackActivity = buildRestaurantRecentActivity({
    restaurants: [
      {
        restaurantId: "b",
        restaurantName: "Coast Spice House",
        directInquiryCount: 1,
        itineraryInquiryCount: 0,
        inquiryCount: 1,
        lastInquiryAt: "2026-05-21T08:30:00.000Z",
      },
      {
        restaurantId: "c",
        restaurantName: "Hidden Garden",
        directInquiryCount: 0,
        itineraryInquiryCount: 1,
        inquiryCount: 1,
        lastInquiryAt: "2026-05-22T08:30:00.000Z",
      },
    ],
  });

  assert.equal(fallbackActivity[0].restaurantId, "c");
  assert.equal(fallbackActivity[0].activityLabel, "Itinerary add-on inquiry");
});
