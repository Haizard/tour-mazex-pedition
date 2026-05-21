import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("api service exposes tenant-admin hotel partner onboarding call", async () => {
  const source = await readFile(new URL("./api.js", import.meta.url), "utf8");

  assert.equal(source.includes("createHotelPartnerAdmin"), true);
  assert.equal(source.includes('API.post(`/hotels/${id}/partner-admins`, data)'), true);
});

test("api service exposes hotel partner accommodation request calls", async () => {
  const source = await readFile(new URL("./api.js", import.meta.url), "utf8");

  assert.equal(source.includes("fetchHotelPartnerAccommodationRequests"), true);
  assert.equal(source.includes('cachedGet("/hotel-partner/accommodation-requests"'), true);
  assert.equal(source.includes("updateHotelPartnerAccommodationRequest"), true);
  assert.equal(source.includes('API.patch(`/hotel-partner/accommodation-requests/${requestId}`, data'), true);
});

test("api service exposes tenant-admin hotel partner profile review call", async () => {
  const source = await readFile(new URL("./api.js", import.meta.url), "utf8");

  assert.equal(source.includes("reviewHotelPartnerProfileUpdate"), true);
  assert.equal(source.includes('API.post(`/hotels/${id}/partner-profile-review`, data)'), true);
});
