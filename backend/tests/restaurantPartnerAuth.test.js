import test from "node:test";
import assert from "node:assert/strict";

import {
  signAdminToken,
  signHotelPartnerToken,
  signRestaurantPartnerToken,
  verifyRestaurantPartnerToken,
} from "../utils/adminAuth.js";

test("restaurant partner tokens carry a separate restaurant_partner scope", () => {
  const token = signRestaurantPartnerToken({
    partnerAdminId: "partner-admin-1",
    tenantId: "tenant-1",
    username: "owner@example.com",
    role: "restaurant-manager",
    restaurantIds: ["restaurant-1", "restaurant-2"],
    expiresInMs: 60_000,
  });

  const payload = verifyRestaurantPartnerToken(token);

  assert.equal(payload.scope, "restaurant_partner");
  assert.equal(payload.partnerAdminId, "partner-admin-1");
  assert.equal(payload.tenantId, "tenant-1");
  assert.deepEqual(payload.restaurantIds, ["restaurant-1", "restaurant-2"]);
});

test("restaurant partner verification rejects tenant admin tokens", () => {
  const tenantAdminToken = signAdminToken({
    adminId: "admin-1",
    tenantId: "tenant-1",
    username: "operator",
    role: "owner",
    expiresInMs: 60_000,
  });

  assert.throws(
    () => verifyRestaurantPartnerToken(tenantAdminToken),
    /not a restaurant partner token/i
  );
});

test("restaurant partner verification rejects hotel partner tokens", () => {
  const hotelPartnerToken = signHotelPartnerToken({
    partnerAdminId: "hotel-partner-1",
    tenantId: "tenant-1",
    username: "frontdesk",
    role: "hotel-manager",
    hotelIds: ["hotel-1"],
    expiresInMs: 60_000,
  });

  assert.throws(
    () => verifyRestaurantPartnerToken(hotelPartnerToken),
    /not a restaurant partner token/i
  );
});
