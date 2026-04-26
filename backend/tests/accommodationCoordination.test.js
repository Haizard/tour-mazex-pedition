import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAccommodationConflictMap,
  buildAccommodationDashboard,
  buildAccommodationSupplierMessage,
  summarizeAccommodationReservation,
} from "../utils/accommodationCoordination.js";

test("summarizeAccommodationReservation highlights confirmed reservations", () => {
  const result = summarizeAccommodationReservation({
    status: "confirmed",
    hotelName: "Serengeti Serena Lodge",
    checkInDate: "2026-07-10T00:00:00.000Z",
    checkOutDate: "2026-07-12T00:00:00.000Z",
  });

  assert.equal(result.badgeLabel, "Confirmed");
  assert.equal(result.summary.includes("Serengeti Serena Lodge"), true);
  assert.equal(result.summary.includes("July"), true);
});

test("summarizeAccommodationReservation handles pending supplier follow-up", () => {
  const result = summarizeAccommodationReservation({
    status: "pending",
    hotelName: "Ngorongoro Farm House",
  });

  assert.equal(result.badgeLabel, "Pending");
  assert.equal(result.summary.includes("Awaiting supplier confirmation"), true);
});

test("buildAccommodationConflictMap flags overlapping stays at the same property", () => {
  const result = buildAccommodationConflictMap([
    {
      _id: "stay-1",
      hotelName: "Serengeti Serena Lodge",
      bookingGuestName: "Anna Safari",
      checkInDate: "2026-07-10T00:00:00.000Z",
      checkOutDate: "2026-07-12T00:00:00.000Z",
      status: "confirmed",
    },
    {
      _id: "stay-2",
      hotelName: "Serengeti Serena Lodge",
      bookingGuestName: "David Guest",
      checkInDate: "2026-07-11T00:00:00.000Z",
      checkOutDate: "2026-07-13T00:00:00.000Z",
      status: "confirmed",
    },
  ]);

  assert.equal((result.get("stay-1") || []).length, 1);
  assert.equal((result.get("stay-2") || []).length, 1);
  assert.equal((result.get("stay-1") || [])[0].type, "overlapping-stay");
});

test("buildAccommodationSupplierMessage includes the key supplier details", () => {
  const result = buildAccommodationSupplierMessage({
    supplierName: "Lodge Team",
    bookingGuestName: "Anna Safari",
    hotelName: "Serengeti Serena Lodge",
    roomPlan: "2 doubles",
    checkInDate: "2026-07-10T00:00:00.000Z",
    checkOutDate: "2026-07-12T00:00:00.000Z",
    guestCount: 4,
  });

  assert.equal(result.includes("Anna Safari"), true);
  assert.equal(result.includes("Serengeti Serena Lodge"), true);
  assert.equal(result.includes("2 doubles"), true);
});

test("buildAccommodationDashboard highlights bookings that still need lodging", () => {
  const result = buildAccommodationDashboard(
    [
      {
        _id: "booking-1",
        name: "Anna Safari",
        packageTour: "Serengeti Explorer",
        travelDate: "2026-07-10T00:00:00.000Z",
        status: "Confirmed",
      },
    ],
    []
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].needsAccommodation, true);
});
