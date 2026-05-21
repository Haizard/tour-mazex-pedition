import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelPartnerAdminPayload,
  buildHotelPayload,
  createEmptyHotelDraft,
  createEmptyHotelPartnerAdminDraft,
  filterHotelRows,
  getHotelPartnerLoginPath,
} from "./hotelManagerState.js";

test("createEmptyHotelDraft provides marketplace-safe defaults", () => {
  const draft = createEmptyHotelDraft();

  assert.equal(draft.published, false);
  assert.equal(draft.marketplaceVisible, false);
  assert.equal(draft.sponsoredPlacement, false);
  assert.deepEqual(draft.amenities, []);
});

test("buildHotelPayload normalizes amenities and numeric trust fields", () => {
  const payload = buildHotelPayload({
    name: " Arusha Garden Lodge ",
    amenitiesText: "Pool, Airport transfer, Pool",
    averageRating: "4.8",
    reviewCount: "21",
    latitude: "-3.37",
    longitude: "36.69",
  });

  assert.equal(payload.name, "Arusha Garden Lodge");
  assert.deepEqual(payload.amenities, ["Pool", "Airport transfer"]);
  assert.equal(payload.averageRating, 4.8);
  assert.equal(payload.reviewCount, 21);
  assert.deepEqual(payload.geo, { latitude: -3.37, longitude: 36.69 });
});

test("filterHotelRows applies status and search filters", () => {
  const rows = filterHotelRows(
    [
      { name: "Arusha Garden Lodge", destination: "Arusha", published: true, marketplaceVisible: true },
      { name: "Hidden Camp", destination: "Serengeti", published: false, marketplaceVisible: false },
    ],
    { search: "arusha", status: "public" }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Arusha Garden Lodge");
});

test("createEmptyHotelPartnerAdminDraft provides onboarding defaults", () => {
  const draft = createEmptyHotelPartnerAdminDraft();

  assert.equal(draft.role, "hotel-owner");
  assert.equal(draft.username, "");
  assert.equal(draft.password, "");
});

test("buildHotelPartnerAdminPayload normalizes account credentials", () => {
  const payload = buildHotelPartnerAdminPayload({
    username: " FrontDesk ",
    password: " safari123 ",
    displayName: " Front Desk ",
    role: "hotel-manager",
    status: "disabled",
  });

  assert.deepEqual(payload, {
    username: "frontdesk",
    password: "safari123",
    displayName: "Front Desk",
    role: "hotel-manager",
  });
});

test("getHotelPartnerLoginPath uses demo tenant context when present", () => {
  assert.equal(getHotelPartnerLoginPath("/demo/maz-expeditions/admin"), "/demo/maz-expeditions/hotel-partner/login");
  assert.equal(getHotelPartnerLoginPath("/admin"), "/hotel-partner/login");
});
