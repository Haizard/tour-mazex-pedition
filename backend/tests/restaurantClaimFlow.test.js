import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantClaimRequestPayload,
  buildRestaurantClaimReviewUpdate,
  buildApprovedRestaurantPartnerAdminPayload,
  shapeRestaurantClaimQueueItem,
} from "../utils/restaurantClaimFlow.js";

test("buildRestaurantClaimRequestPayload normalizes existing restaurant claim submissions", async () => {
  const payload = await buildRestaurantClaimRequestPayload(
    {
      restaurantId: "restaurant-1",
      restaurantNameSnapshot: "  The Safari Table  ",
      destinationSnapshot: "  Arusha  ",
      regionSnapshot: "  Northern Tanzania  ",
      claimantName: "  Jane Doe  ",
      claimantEmail: "  JANE@EXAMPLE.COM  ",
      claimantPhone: "  +255700000000  ",
      claimantRole: "restaurant-manager",
      proofNote: "  I manage daily operations.  ",
      proofLinks: "https://example.com, https://instagram.com/safaritable",
      password: "secret123",
      claimType: "existing-listing",
    },
    { tenantId: "tenant-1" }
  );

  assert.deepEqual(payload, {
    tenantId: "tenant-1",
    restaurantId: "restaurant-1",
    restaurantNameSnapshot: "The Safari Table",
    destinationSnapshot: "Arusha",
    regionSnapshot: "Northern Tanzania",
    claimantName: "Jane Doe",
    claimantEmail: "jane@example.com",
    claimantPhone: "+255700000000",
    claimantRole: "restaurant-manager",
    proofNote: "I manage daily operations.",
    proofLinks: ["https://example.com", "https://instagram.com/safaritable"],
    claimType: "existing-listing",
    status: "pending",
    requestedUsername: "jane@example.com",
    passwordHash: payload.passwordHash,
    passwordSalt: payload.passwordSalt,
  });
  assert.equal(typeof payload.passwordHash, "string");
  assert.equal(typeof payload.passwordSalt, "string");
  assert.equal("password" in payload, false);
});

test("buildRestaurantClaimRequestPayload requires an existing restaurant or proposed restaurant details", async () => {
  await assert.rejects(
    () =>
      buildRestaurantClaimRequestPayload({
        claimantName: "Jane Doe",
        claimantEmail: "jane@example.com",
        password: "secret123",
      }),
    /existing restaurant selection or proposed restaurant details are required/i
  );
});

test("buildRestaurantClaimRequestPayload requires a password for safe restaurant partner onboarding", async () => {
  await assert.rejects(
    () =>
      buildRestaurantClaimRequestPayload({
        restaurantId: "restaurant-1",
        claimantName: "Jane Doe",
        claimantEmail: "jane@example.com",
      }),
    /password is required/i
  );
});

test("buildRestaurantClaimRequestPayload shapes new restaurant listing requests", async () => {
  const payload = await buildRestaurantClaimRequestPayload({
    claimType: "new-listing-request",
    restaurantNameSnapshot: "Savannah Flame",
    destinationSnapshot: "Nairobi",
    regionSnapshot: "Nairobi County",
    claimantName: "Asha",
    claimantEmail: "asha@example.com",
    requestedUsername: " flame-admin ",
    password: "secret123",
    proposedRestaurantPayload: {
      summary: "Wood-fired grill and cocktails.",
      description: "A lively dinner spot near the park.",
      cuisineTypes: "Steakhouse, Grill",
      mealTypes: ["Dinner"],
      dietaryFits: "Vegetarian-friendly",
      ambianceTags: "Date night, Rooftop",
      openingHoursSummary: "Daily, 5pm to 11pm",
      reservationStyleSummary: "Reservations recommended for dinner service.",
      photos: ["https://example.com/flame.jpg"],
      trustSummary: "Popular for sunset dining and grilled specialties.",
    },
  });

  assert.equal(payload.restaurantId, null);
  assert.equal(payload.claimType, "new-listing-request");
  assert.equal(payload.requestedUsername, "flame-admin");
  assert.deepEqual(payload.proposedRestaurantPayload, {
    name: "Savannah Flame",
    slug: "savannah-flame",
    summary: "Wood-fired grill and cocktails.",
    description: "A lively dinner spot near the park.",
    destination: "Nairobi",
    region: "Nairobi County",
    cuisineTypes: ["Steakhouse", "Grill"],
    mealTypes: ["Dinner"],
    dietaryFits: ["Vegetarian-friendly"],
    ambianceTags: ["Date night", "Rooftop"],
    openingHoursSummary: "Daily, 5pm to 11pm",
    reservationStyleSummary: "Reservations recommended for dinner service.",
    photos: ["https://example.com/flame.jpg"],
    trustSummary: "Popular for sunset dining and grilled specialties.",
    sourceMeta: {
      claimOrigin: "restaurant-self-claim",
    },
    published: false,
    marketplaceVisible: false,
    sponsoredPlacement: false,
    status: "draft",
  });
});

test("buildRestaurantClaimReviewUpdate supports moderation outcomes", () => {
  const needsMoreProof = buildRestaurantClaimReviewUpdate(
    { action: "needs-more-proof", reviewNote: "Please share a menu link." },
    { reviewerId: "admin-1" }
  );

  assert.equal(needsMoreProof.status, "needs-more-proof");
  assert.equal(needsMoreProof.reviewedBy, "admin-1");
  assert.equal(needsMoreProof.reviewNote, "Please share a menu link.");
  assert.equal(Boolean(needsMoreProof.reviewedAt), true);

  const approved = buildRestaurantClaimReviewUpdate(
    { action: "approve" },
    { reviewerId: "admin-2" }
  );
  assert.equal(approved.status, "approved");

  const rejected = buildRestaurantClaimReviewUpdate(
    { action: "reject", reviewNote: "Could not verify ownership." },
    { reviewerId: "admin-3" }
  );
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.reviewedBy, "admin-3");
});

test("buildApprovedRestaurantPartnerAdminPayload creates safe restaurant partner account fields", () => {
  const payload = buildApprovedRestaurantPartnerAdminPayload({
    tenantId: "tenant-1",
    restaurantId: "restaurant-1",
    claimantName: "Jane Doe",
    claimantRole: "restaurant-manager",
    requestedUsername: "",
    claimantEmail: "jane@example.com",
    passwordHash: "hash",
    passwordSalt: "salt",
  });

  assert.deepEqual(payload, {
    tenantId: "tenant-1",
    restaurantIds: ["restaurant-1"],
    username: "jane@example.com",
    displayName: "Jane Doe",
    role: "restaurant-manager",
    status: "active",
    passwordHash: "hash",
    passwordSalt: "salt",
  });
});

test("shapeRestaurantClaimQueueItem keeps moderation context and excludes unsafe internals", () => {
  const shaped = shapeRestaurantClaimQueueItem({
    _id: "claim-1",
    tenantId: "tenant-1",
    restaurantId: "restaurant-1",
    restaurantNameSnapshot: "The Safari Table",
    destinationSnapshot: "Arusha",
    regionSnapshot: "Northern Tanzania",
    claimantEmail: "JANE@EXAMPLE.COM",
    claimantRole: "invalid-role",
    proofLinks: ["https://example.com"],
    proposedRestaurantPayload: { name: "Draft restaurant" },
    linkedPartnerAdminId: "partner-1",
    requestedUsername: "owner@safari.example",
    passwordHash: "hash",
    passwordSalt: "salt",
    status: "pending",
    internalSecret: "ignore-me",
  });

  assert.deepEqual(shaped, {
    id: "claim-1",
    tenantId: "tenant-1",
    restaurantId: "restaurant-1",
    restaurantNameSnapshot: "The Safari Table",
    destinationSnapshot: "Arusha",
    regionSnapshot: "Northern Tanzania",
    claimantName: "",
    claimantEmail: "jane@example.com",
    claimantPhone: "",
    claimantRole: "restaurant-owner",
    proofNote: "",
    proofLinks: ["https://example.com"],
    claimType: "existing-listing",
    status: "pending",
    requestedUsername: "owner@safari.example",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: "",
    linkedPartnerAdminId: "partner-1",
    proposedRestaurantPayload: { name: "Draft restaurant" },
    createdAt: null,
    updatedAt: null,
  });
  assert.equal("internalSecret" in shaped, false);
  assert.equal("passwordHash" in shaped, false);
  assert.equal("passwordSalt" in shaped, false);
});
