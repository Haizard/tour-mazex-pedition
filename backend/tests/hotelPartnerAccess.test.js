import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelPartnerAdminAccountPayload,
  buildHotelPartnerAccommodationResponseUpdate,
  buildHotelPartnerProfileUpdate,
  canHotelPartnerManageAccommodationRequest,
  canHotelPartnerManageHotel,
} from "../utils/hotelPartnerAccess.js";

test("canHotelPartnerManageHotel only allows assigned tenant-scoped hotels", () => {
  const partnerAdmin = {
    tenantId: "tenant-1",
    hotelIds: ["hotel-1", "hotel-2"],
  };

  assert.equal(
    canHotelPartnerManageHotel(partnerAdmin, { _id: "hotel-1", tenantId: "tenant-1" }),
    true
  );
  assert.equal(
    canHotelPartnerManageHotel(partnerAdmin, { _id: "hotel-3", tenantId: "tenant-1" }),
    false
  );
  assert.equal(
    canHotelPartnerManageHotel(partnerAdmin, { _id: "hotel-1", tenantId: "tenant-2" }),
    false
  );
});

test("buildHotelPartnerProfileUpdate keeps approval fields tourism-admin-only", () => {
  const payload = buildHotelPartnerProfileUpdate({
    name: "Arusha Garden Lodge",
    summary: "Close to Arusha National Park.",
    amenities: "Pool, WiFi, Spa",
    photos: ["https://example.com/photo.jpg"],
    averageRating: 5,
    published: true,
    marketplaceVisible: true,
    sponsoredPlacement: true,
    tenantId: "tenant-2",
  });

  assert.equal(payload.name, "Arusha Garden Lodge");
  assert.deepEqual(payload.amenities, ["Pool", "WiFi", "Spa"]);
  assert.deepEqual(payload.photos, ["https://example.com/photo.jpg"]);
  assert.equal("published" in payload, false);
  assert.equal("marketplaceVisible" in payload, false);
  assert.equal("sponsoredPlacement" in payload, false);
  assert.equal("tenantId" in payload, false);
});

test("buildHotelPartnerAdminAccountPayload prepares tenant-created partner accounts", () => {
  const payload = buildHotelPartnerAdminAccountPayload({
    username: " FrontDesk ",
    displayName: "Front Desk",
    password: "secret123",
    role: "hotel-manager",
    status: "disabled",
    hotelIds: ["bad-hotel"],
  });

  assert.equal(payload.username, "frontdesk");
  assert.equal(payload.displayName, "Front Desk");
  assert.equal(payload.password, "secret123");
  assert.equal(payload.role, "hotel-manager");
  assert.equal(payload.status, "active");
  assert.equal("hotelIds" in payload, false);
});

test("canHotelPartnerManageAccommodationRequest only allows assigned hotel requests", () => {
  const partnerAdmin = {
    tenantId: "tenant-1",
    hotelIds: ["hotel-1"],
  };

  assert.equal(
    canHotelPartnerManageAccommodationRequest(partnerAdmin, {
      tenantId: "tenant-1",
      hotelId: "hotel-1",
    }),
    true
  );
  assert.equal(
    canHotelPartnerManageAccommodationRequest(partnerAdmin, {
      tenantId: "tenant-1",
      hotelId: "hotel-2",
    }),
    false
  );
  assert.equal(
    canHotelPartnerManageAccommodationRequest(partnerAdmin, {
      tenantId: "tenant-2",
      hotelId: "hotel-1",
    }),
    false
  );
});

test("buildHotelPartnerAccommodationResponseUpdate keeps request response fields narrow", () => {
  const payload = buildHotelPartnerAccommodationResponseUpdate({
    status: "confirmed",
    reservationCode: "LODGE-123",
    notes: "Confirmed king room.",
    bookingId: "booking-2",
    hotelId: "hotel-2",
    guestCount: 99,
  });

  assert.deepEqual(payload, {
    status: "confirmed",
    reservationCode: "LODGE-123",
    notes: "Confirmed king room.",
    lastSupplierMessageSharedAt: payload.lastSupplierMessageSharedAt,
  });
  assert.equal(Boolean(payload.lastSupplierMessageSharedAt), true);
  assert.equal("bookingId" in payload, false);
  assert.equal("hotelId" in payload, false);
  assert.equal("guestCount" in payload, false);
});
