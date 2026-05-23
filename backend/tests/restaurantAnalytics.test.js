import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantAnalyticsSnapshot,
  scoreRestaurantDemand,
} from "../utils/restaurantAnalytics.js";

test("scoreRestaurantDemand rewards direct and itinerary leads differently", () => {
  const score = scoreRestaurantDemand({
    inquiryCount: 6,
    directInquiryCount: 4,
    itineraryInquiryCount: 2,
    acceptedQuoteCount: 1,
  });

  assert.equal(typeof score, "number");
  assert.equal(score > 0, true);
});

test("buildRestaurantAnalyticsSnapshot summarizes sponsored and public restaurants", () => {
  const snapshot = buildRestaurantAnalyticsSnapshot({
    restaurants: [
      {
        _id: "restaurant-1",
        name: "Savanna Table",
        destination: "Arusha",
        sponsoredPlacement: true,
        published: true,
        marketplaceVisible: true,
      },
      {
        _id: "restaurant-2",
        name: "Coast Spice House",
        destination: "Zanzibar",
        sponsoredPlacement: false,
        published: true,
        marketplaceVisible: true,
      },
    ],
    inquiries: [
      {
        restaurantId: "restaurant-1",
        restaurantIntentType: "direct-restaurant",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        restaurantId: "restaurant-1",
        restaurantIntentType: "itinerary-add-on",
        createdAt: "2026-05-21T00:00:00.000Z",
      },
      {
        restaurantId: "restaurant-2",
        restaurantIntentType: "direct-restaurant",
        createdAt: "2026-05-20T00:00:00.000Z",
      },
    ],
    quoteCountsByRestaurantId: {
      "restaurant-1": { acceptedQuoteCount: 1 },
      "restaurant-2": { acceptedQuoteCount: 0 },
    },
  });

  assert.equal(snapshot.summary.totalRestaurants, 2);
  assert.equal(snapshot.summary.publicRestaurants, 2);
  assert.equal(snapshot.summary.sponsoredRestaurants, 1);
  assert.equal(snapshot.summary.totalRestaurantLeads, 3);
  assert.equal(snapshot.summary.directRestaurantLeads, 2);
  assert.equal(snapshot.summary.itineraryRestaurantLeads, 1);
  assert.equal(snapshot.restaurants[0].restaurantId, "restaurant-1");
  assert.equal(snapshot.restaurants[0].acceptedQuoteCount, 1);
  assert.equal(snapshot.restaurants[0].lastInquiryAt, "2026-05-22T00:00:00.000Z");
});

test("buildRestaurantAnalyticsSnapshot exposes sponsored performance and recent activity views", () => {
  const snapshot = buildRestaurantAnalyticsSnapshot({
    restaurants: [
      {
        _id: "restaurant-1",
        name: "Savanna Table",
        destination: "Arusha",
        sponsoredPlacement: true,
        published: true,
        marketplaceVisible: true,
      },
      {
        _id: "restaurant-2",
        name: "Coast Spice House",
        destination: "Zanzibar",
        sponsoredPlacement: true,
        published: true,
        marketplaceVisible: true,
      },
      {
        _id: "restaurant-3",
        name: "Hidden Garden",
        destination: "Moshi",
        sponsoredPlacement: false,
        published: false,
        marketplaceVisible: false,
      },
    ],
    inquiries: [
      {
        restaurantId: "restaurant-2",
        restaurantIntentType: "direct-restaurant",
        createdAt: "2026-05-22T08:30:00.000Z",
      },
      {
        restaurantId: "restaurant-1",
        restaurantIntentType: "itinerary-add-on",
        createdAt: "2026-05-21T18:00:00.000Z",
      },
    ],
    quoteCountsByRestaurantId: {
      "restaurant-1": { acceptedQuoteCount: 1 },
      "restaurant-2": { acceptedQuoteCount: 0 },
    },
  });

  assert.deepEqual(snapshot.sponsoredPerformance.top.map((row) => row.restaurantId), [
    "restaurant-1",
    "restaurant-2",
  ]);
  assert.deepEqual(snapshot.sponsoredPerformance.watch.map((row) => row.restaurantId), [
    "restaurant-2",
    "restaurant-1",
  ]);
  assert.equal(snapshot.recentActivity[0].restaurantId, "restaurant-2");
  assert.equal(snapshot.recentActivity[0].activityLabel, "Direct restaurant inquiry");
});
