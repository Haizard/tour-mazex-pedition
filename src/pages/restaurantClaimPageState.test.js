import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantClaimPayload,
  buildRestaurantClaimSearchParams,
  createEmptyRestaurantClaimDraft,
} from "./restaurantClaimPageState.js";

test("createEmptyRestaurantClaimDraft starts in existing-listing mode", () => {
  const draft = createEmptyRestaurantClaimDraft();

  assert.equal(draft.claimType, "existing-listing");
  assert.equal(draft.claimantName, "");
  assert.equal(draft.requestedUsername, "");
  assert.equal(draft.password, "");
  assert.equal(draft.proposedRestaurantName, "");
});

test("buildRestaurantClaimSearchParams only keeps active search fields", () => {
  assert.deepEqual(
    buildRestaurantClaimSearchParams({
      q: " savanna ",
      destination: " arusha ",
      ignored: "",
    }),
    { q: "savanna", destination: "arusha" }
  );
});

test("buildRestaurantClaimPayload shapes an existing listing claim", () => {
  const payload = buildRestaurantClaimPayload(
    {
      claimantName: "Jane Doe",
      claimantEmail: "jane@example.com",
      claimantPhone: "+255700000000",
      claimantRole: "restaurant-manager",
      proofNote: "I manage service and reservations.",
      proofLinks: "https://example.com",
      requestedUsername: " savanna.table ",
      password: "Secret#123",
      claimType: "existing-listing",
    },
    {
      id: "restaurant-1",
      name: "Savanna Table",
      destination: "Arusha",
    }
  );

  assert.equal(payload.restaurantId, "restaurant-1");
  assert.equal(payload.restaurantNameSnapshot, "Savanna Table");
  assert.equal(payload.destinationSnapshot, "Arusha");
  assert.equal(payload.claimType, "existing-listing");
  assert.equal(payload.requestedUsername, "savanna.table");
  assert.equal(payload.password, "Secret#123");
});

test("buildRestaurantClaimPayload shapes a fallback new listing request", () => {
  const payload = buildRestaurantClaimPayload({
    claimantName: "Asha",
    claimantEmail: "asha@example.com",
    requestedUsername: "",
    password: "ClaimPass!9",
    claimType: "new-listing-request",
    proposedRestaurantName: "Coastline Kitchen",
    proposedDestination: "Zanzibar",
    proposedRegion: "Coast",
    proposedCuisineTypes: "Swahili, Seafood",
    proposedMealTypes: "Lunch\nDinner",
    proposedDietaryFits: "Halal, Vegetarian",
    proposedPhotos: "https://example.com/a.jpg\nhttps://example.com/b.jpg",
  });

  assert.equal(payload.claimType, "new-listing-request");
  assert.equal(payload.restaurantId, "");
  assert.equal(payload.requestedUsername, "");
  assert.equal(payload.password, "ClaimPass!9");
  assert.equal(payload.proposedRestaurantPayload.name, "Coastline Kitchen");
  assert.deepEqual(payload.proposedRestaurantPayload.cuisineTypes, ["Swahili", "Seafood"]);
  assert.deepEqual(payload.proposedRestaurantPayload.mealTypes, ["Lunch", "Dinner"]);
  assert.deepEqual(payload.proposedRestaurantPayload.dietaryFits, ["Halal", "Vegetarian"]);
  assert.deepEqual(payload.proposedRestaurantPayload.photos, [
    "https://example.com/a.jpg",
    "https://example.com/b.jpg",
  ]);
});
