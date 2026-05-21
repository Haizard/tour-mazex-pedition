import test from "node:test";
import assert from "node:assert/strict";

import {
  signAdminToken,
  signHotelPartnerToken,
  verifyHotelPartnerToken,
} from "../utils/adminAuth.js";

test("hotel partner tokens carry a separate hotel_partner scope", () => {
  const token = signHotelPartnerToken({
    partnerAdminId: "partner-admin-1",
    tenantId: "tenant-1",
    username: "frontdesk",
    role: "hotel-manager",
    hotelIds: ["hotel-1", "hotel-2"],
    expiresInMs: 60_000,
  });

  const payload = verifyHotelPartnerToken(token);

  assert.equal(payload.scope, "hotel_partner");
  assert.equal(payload.partnerAdminId, "partner-admin-1");
  assert.equal(payload.tenantId, "tenant-1");
  assert.deepEqual(payload.hotelIds, ["hotel-1", "hotel-2"]);
});

test("hotel partner verification rejects tenant admin tokens", () => {
  const tenantAdminToken = signAdminToken({
    adminId: "admin-1",
    tenantId: "tenant-1",
    username: "operator",
    role: "owner",
    expiresInMs: 60_000,
  });

  assert.throws(
    () => verifyHotelPartnerToken(tenantAdminToken),
    /not a hotel partner token/i
  );
});
