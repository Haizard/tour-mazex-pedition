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

test("api service exposes public hotel AI concierge recommendations", async () => {
  const source = await readFile(new URL("./api.js", import.meta.url), "utf8");

  assert.equal(source.includes("requestHotelConciergeRecommendations"), true);
  assert.equal(source.includes('API.post("/hotels/public/concierge/recommendations", data)'), true);
});

test("api service exposes hotel analytics and related hotel reads", async () => {
  const source = await readFile(new URL("./api.js", import.meta.url), "utf8");

  assert.equal(source.includes("fetchHotelAnalytics"), true);
  assert.equal(source.includes('cachedGet("/hotels/analytics")'), true);
  assert.equal(source.includes("fetchRelatedHotels"), true);
  assert.equal(source.includes('cachedGet(`/hotels/public/${encodeURIComponent(slug)}/related`)'), true);
});

test("api service exposes public hotel claim intake and tenant-admin claim moderation", async () => {
  const source = await readFile(new URL("./api.js", import.meta.url), "utf8");

  assert.equal(source.includes("searchHotelClaimListings"), true);
  assert.equal(source.includes('cachedGet("/hotels/public/claim-search"'), true);
  assert.equal(source.includes("submitHotelClaimRequest"), true);
  assert.equal(source.includes('API.post("/hotels/public/claims", data)'), true);
  assert.equal(source.includes("fetchHotelClaimRequests"), true);
  assert.equal(source.includes('cachedGet("/hotels/claims"'), true);
  assert.equal(source.includes("reviewHotelClaimRequest"), true);
  assert.equal(source.includes('API.post(`/hotels/claims/${id}/review`, data)'), true);
});
