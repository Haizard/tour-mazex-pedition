import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPartnerAccommodationResponsePayload,
  buildPartnerInventoryPayload,
  buildPartnerHotelUpdatePayload,
  createEmptyPartnerHotelDraft,
  createEmptyPartnerInventoryDraft,
  createEmptyPartnerRequestDraft,
  filterPartnerAccommodationRequests,
  filterPartnerInventoryEntries,
  filterPartnerHotels,
} from "./hotelPartnerDashboardState.js";

test("createEmptyPartnerHotelDraft starts with profile-only fields", () => {
  const draft = createEmptyPartnerHotelDraft();

  assert.deepEqual(Object.keys(draft).sort(), [
    "amenities",
    "description",
    "destination",
    "name",
    "photos",
    "region",
    "roomStyleSummary",
    "summary",
    "trustSummary",
  ]);
});

test("buildPartnerHotelUpdatePayload strips tenant-admin approval fields", () => {
  const payload = buildPartnerHotelUpdatePayload({
    name: "Arusha Garden Lodge",
    amenities: "Pool, WiFi",
    photos: "https://example.com/one.jpg\nhttps://example.com/two.jpg",
    published: true,
    marketplaceVisible: true,
  });

  assert.deepEqual(payload.amenities, ["Pool", "WiFi"]);
  assert.deepEqual(payload.photos, [
    "https://example.com/one.jpg",
    "https://example.com/two.jpg",
  ]);
  assert.equal("published" in payload, false);
  assert.equal("marketplaceVisible" in payload, false);
});

test("filterPartnerHotels searches assigned hotel records", () => {
  const hotels = [
    { name: "Arusha Garden Lodge", destination: "Arusha" },
    { name: "Serengeti River Camp", destination: "Serengeti" },
  ];

  assert.deepEqual(filterPartnerHotels(hotels, "river").map((hotel) => hotel.name), [
    "Serengeti River Camp",
  ]);
});

test("createEmptyPartnerRequestDraft starts with confirmation response defaults", () => {
  const draft = createEmptyPartnerRequestDraft();

  assert.equal(draft.status, "confirmed");
  assert.equal(draft.reservationCode, "");
  assert.equal(draft.notes, "");
});

test("buildPartnerAccommodationResponsePayload normalizes response fields", () => {
  const payload = buildPartnerAccommodationResponsePayload({
    status: "cancelled",
    reservationCode: "  ABC-123 ",
    notes: " Sold out ",
    hotelId: "hotel-2",
  });

  assert.deepEqual(payload, {
    status: "cancelled",
    reservationCode: "ABC-123",
    notes: "Sold out",
  });
});

test("filterPartnerAccommodationRequests searches traveler and hotel request fields", () => {
  const requests = [
    { bookingGuestName: "Amina Said", hotelName: "Arusha Lodge", status: "pending" },
    { bookingGuestName: "Daniel", hotelName: "Serengeti Camp", status: "confirmed" },
  ];

  assert.deepEqual(
    filterPartnerAccommodationRequests(requests, { search: "amina", status: "pending" }).map(
      (request) => request.bookingGuestName
    ),
    ["Amina Said"]
  );
});

test("createEmptyPartnerInventoryDraft starts with inventory defaults", () => {
  const draft = createEmptyPartnerInventoryDraft();

  assert.equal(Array.isArray(draft.roomInventory), true);
  assert.equal(Array.isArray(draft.availabilityCalendar), true);
  assert.equal(draft.inventorySettings.defaultStatus, "open");
});

test("buildPartnerInventoryPayload normalizes room and calendar inventory", () => {
  const payload = buildPartnerInventoryPayload({
    roomInventory: [
      {
        roomTypeCode: " deluxe ",
        label: " Deluxe Room ",
        capacity: "2",
        totalUnits: "5",
        baseNightlyRate: "180",
        currency: "usd",
      },
    ],
    availabilityCalendar: [
      {
        date: "2026-07-12",
        roomTypeCode: "deluxe",
        status: "limited",
        availableUnits: "2",
      },
    ],
    inventorySettings: {
      defaultCurrency: "usd",
    },
  });

  assert.equal(payload.roomInventory[0].roomTypeCode, "deluxe");
  assert.equal(payload.roomInventory[0].currency, "USD");
  assert.equal(payload.availabilityCalendar[0].availableUnits, 2);
  assert.equal(payload.inventorySettings.defaultCurrency, "USD");
});

test("filterPartnerInventoryEntries searches room and note fields", () => {
  const rows = filterPartnerInventoryEntries(
    [
      { roomTypeCode: "deluxe", label: "Deluxe Room", status: "open", note: "Best seller" },
      { roomTypeCode: "suite", label: "Suite", status: "sold-out", note: "Peak season" },
    ],
    { search: "deluxe", status: "open" }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].roomTypeCode, "deluxe");
});
