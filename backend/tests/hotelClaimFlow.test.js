import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelClaimRequestPayload,
  buildHotelClaimReviewUpdate,
  buildApprovedHotelPartnerAdminPayload,
  shapeHotelClaimQueueItem,
} from "../utils/hotelClaimFlow.js";

test("buildHotelClaimRequestPayload normalizes existing-listing claim submissions", async () => {
  const payload = await buildHotelClaimRequestPayload({
    hotelId: "hotel-1",
    hotelNameSnapshot: " Arusha Garden Lodge ",
    destinationSnapshot: " Arusha ",
    claimantName: " Jane Doe ",
    claimantEmail: " JANE@EXAMPLE.COM ",
    claimantPhone: " +255700000000 ",
    claimantRole: "hotel-manager",
    proofNote: "I manage the front desk.",
    proofLinks: "https://example.com, https://instagram.com/arusha-garden",
    requestedUsername: " FrontDesk ",
    password: "secret123",
    reviewNote: "should not persist",
    claimType: "existing-listing",
  });

  assert.equal(payload.hotelId, "hotel-1");
  assert.equal(payload.hotelNameSnapshot, "Arusha Garden Lodge");
  assert.equal(payload.destinationSnapshot, "Arusha");
  assert.equal(payload.claimantName, "Jane Doe");
  assert.equal(payload.claimantEmail, "jane@example.com");
  assert.equal(payload.claimantPhone, "+255700000000");
  assert.equal(payload.claimantRole, "hotel-manager");
  assert.equal(payload.claimType, "existing-listing");
  assert.equal(payload.status, "pending");
  assert.equal(payload.requestedUsername, "frontdesk");
  assert.deepEqual(payload.proofLinks, [
    "https://example.com",
    "https://instagram.com/arusha-garden",
  ]);
  assert.equal(typeof payload.passwordHash, "string");
  assert.equal(typeof payload.passwordSalt, "string");
  assert.equal("password" in payload, false);
  assert.equal("reviewNote" in payload, false);
  assert.equal(payload.proposedHotelPayload, undefined);
});

test("buildHotelClaimRequestPayload requires a hotel or proposed listing", async () => {
  await assert.rejects(
    () =>
      buildHotelClaimRequestPayload({
        claimantName: "Jane Doe",
        claimantEmail: "jane@example.com",
        requestedUsername: "janedoe",
        password: "secret123",
      }),
    /existing hotel selection or proposed hotel details are required/i
  );
});

test("buildHotelClaimRequestPayload shapes fallback new listing requests", async () => {
  const payload = await buildHotelClaimRequestPayload({
    claimType: "new-listing-request",
    hotelNameSnapshot: "Ngorongoro Rim Retreat",
    destinationSnapshot: "Ngorongoro",
    claimantName: "Asha",
    claimantEmail: "asha@example.com",
    requestedUsername: "asha-retreat",
    password: "secret123",
    proposedHotelPayload: {
      summary: "Quiet crater rim stay.",
      destination: "Ngorongoro",
      region: "Northern Tanzania",
      accommodationType: "lodge",
      amenities: "WiFi, Fireplace, Full board",
      photos: ["https://example.com/rim.jpg"],
    },
  });

  assert.equal(payload.claimType, "new-listing-request");
  assert.equal(payload.hotelId, null);
  assert.equal(payload.proposedHotelPayload.name, "Ngorongoro Rim Retreat");
  assert.equal(payload.proposedHotelPayload.destination, "Ngorongoro");
  assert.deepEqual(payload.proposedHotelPayload.amenities, ["WiFi", "Fireplace", "Full board"]);
});

test("buildHotelClaimReviewUpdate supports approve reject and needs-more-proof outcomes", () => {
  const needsMoreProof = buildHotelClaimReviewUpdate(
    { action: "needs-more-proof", reviewNote: "Please share your work email domain." },
    { reviewerId: "admin-1" }
  );

  assert.equal(needsMoreProof.status, "needs-more-proof");
  assert.equal(needsMoreProof.reviewedBy, "admin-1");
  assert.equal(needsMoreProof.reviewNote, "Please share your work email domain.");
  assert.equal(Boolean(needsMoreProof.reviewedAt), true);

  const approved = buildHotelClaimReviewUpdate({ action: "approve" }, { reviewerId: "admin-1" });
  assert.equal(approved.status, "approved");

  const rejected = buildHotelClaimReviewUpdate({ action: "reject", reviewNote: "Not enough proof." }, { reviewerId: "admin-2" });
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.reviewedBy, "admin-2");
  assert.equal(rejected.reviewNote, "Not enough proof.");
});

test("buildApprovedHotelPartnerAdminPayload creates safe hotel partner account fields", () => {
  const payload = buildApprovedHotelPartnerAdminPayload({
    tenantId: "tenant-1",
    hotelId: "hotel-1",
    requestedUsername: "frontdesk",
    claimantName: "Jane Doe",
    claimantRole: "hotel-manager",
    passwordHash: "hash",
    passwordSalt: "salt",
  });

  assert.deepEqual(payload, {
    tenantId: "tenant-1",
    hotelIds: ["hotel-1"],
    username: "frontdesk",
    displayName: "Jane Doe",
    role: "hotel-manager",
    status: "active",
    passwordHash: "hash",
    passwordSalt: "salt",
  });
});

test("shapeHotelClaimQueueItem hides auth material while keeping moderation context", () => {
  const shaped = shapeHotelClaimQueueItem({
    _id: "claim-1",
    hotelId: "hotel-1",
    hotelNameSnapshot: "Arusha Garden Lodge",
    claimantEmail: "jane@example.com",
    requestedUsername: "frontdesk",
    passwordHash: "hash",
    passwordSalt: "salt",
    proofLinks: ["https://example.com"],
    status: "pending",
  });

  assert.equal(shaped.id, "claim-1");
  assert.equal(shaped.hotelId, "hotel-1");
  assert.equal(shaped.claimantEmail, "jane@example.com");
  assert.equal(shaped.requestedUsername, "frontdesk");
  assert.deepEqual(shaped.proofLinks, ["https://example.com"]);
  assert.equal("passwordHash" in shaped, false);
  assert.equal("passwordSalt" in shaped, false);
});
