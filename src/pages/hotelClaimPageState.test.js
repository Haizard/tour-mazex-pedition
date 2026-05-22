import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelClaimPayload,
  buildHotelClaimSearchParams,
  createEmptyHotelClaimDraft,
} from "./hotelClaimPageState.js";

test("createEmptyHotelClaimDraft starts in existing-listing mode", () => {
  const draft = createEmptyHotelClaimDraft();

  assert.equal(draft.claimType, "existing-listing");
  assert.equal(draft.claimantName, "");
  assert.equal(draft.proposedHotelName, "");
});

test("buildHotelClaimSearchParams only keeps active search fields", () => {
  assert.deepEqual(
    buildHotelClaimSearchParams({ q: "arusha", destination: "northern", ignored: "" }),
    { q: "arusha", destination: "northern" }
  );
});

test("buildHotelClaimPayload shapes an existing listing claim", () => {
  const payload = buildHotelClaimPayload(
    {
      claimantName: "Jane Doe",
      claimantEmail: "jane@example.com",
      claimantPhone: "+255700000000",
      claimantRole: "hotel-manager",
      proofNote: "I manage the front desk.",
      proofLinks: "https://example.com",
      requestedUsername: "frontdesk",
      password: "secret123",
      claimType: "existing-listing",
    },
    {
      id: "hotel-1",
      name: "Arusha Garden Lodge",
      destination: "Arusha",
    }
  );

  assert.equal(payload.hotelId, "hotel-1");
  assert.equal(payload.hotelNameSnapshot, "Arusha Garden Lodge");
  assert.equal(payload.destinationSnapshot, "Arusha");
  assert.equal(payload.claimType, "existing-listing");
  assert.equal(payload.requestedUsername, "frontdesk");
});

test("buildHotelClaimPayload shapes a fallback new listing request", () => {
  const payload = buildHotelClaimPayload({
    claimantName: "Asha",
    claimantEmail: "asha@example.com",
    requestedUsername: "asha-retreat",
    password: "secret123",
    claimType: "new-listing-request",
    proposedHotelName: "Ngorongoro Rim Retreat",
    proposedDestination: "Ngorongoro",
    proposedRegion: "Northern Tanzania",
    proposedAccommodationType: "lodge",
    proposedAmenities: "WiFi, Fireplace",
    proposedPhotos: "https://example.com/a.jpg\nhttps://example.com/b.jpg",
  });

  assert.equal(payload.claimType, "new-listing-request");
  assert.equal(payload.hotelId, "");
  assert.equal(payload.proposedHotelPayload.name, "Ngorongoro Rim Retreat");
  assert.deepEqual(payload.proposedHotelPayload.amenities, ["WiFi", "Fireplace"]);
  assert.deepEqual(payload.proposedHotelPayload.photos, [
    "https://example.com/a.jpg",
    "https://example.com/b.jpg",
  ]);
});
