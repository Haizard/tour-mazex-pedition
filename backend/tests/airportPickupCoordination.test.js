import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAirportPickupConflictMap,
  buildAirportPickupDashboard,
  buildAirportPickupDispatchNote,
  summarizeAirportPickup,
} from "../utils/airportPickupCoordination.js";

test("summarizeAirportPickup highlights scheduled airport pickups", () => {
  const result = summarizeAirportPickup({
    status: "scheduled",
    guestName: "Amina Joseph",
    airportCode: "JRO",
    pickupDateTime: "2026-09-14T09:30:00.000Z",
    driverName: "Moses Lekule",
  });

  assert.equal(result.badgeLabel, "Scheduled");
  assert.equal(result.summary.includes("Amina Joseph"), true);
  assert.equal(result.summary.includes("JRO"), true);
  assert.equal(result.summary.includes("Moses Lekule"), true);
});

test("summarizeAirportPickup highlights dispatch gaps", () => {
  const result = summarizeAirportPickup({
    status: "pending",
    guestName: "David Mollel",
    airportCode: "ARK",
  });

  assert.equal(result.badgeLabel, "Pending");
  assert.equal(result.summary.includes("needs driver assignment"), true);
});

test("buildAirportPickupConflictMap flags tightly overlapping driver dispatches", () => {
  const result = buildAirportPickupConflictMap(
    [
      {
        _id: "pickup-1",
        driverId: "driver-1",
        driverName: "Moses Lekule",
        pickupDateTime: "2026-09-14T09:30:00.000Z",
        status: "scheduled",
      },
      {
        _id: "pickup-2",
        driverId: "driver-1",
        driverName: "Moses Lekule",
        pickupDateTime: "2026-09-14T10:30:00.000Z",
        status: "scheduled",
      },
    ],
    [
      {
        _id: "driver-1",
        fullName: "Moses Lekule",
        staffType: "driver",
        availabilityStatus: "available",
      },
    ]
  );

  assert.equal((result.get("pickup-1") || []).length > 0, true);
  assert.equal((result.get("pickup-2") || []).length > 0, true);
});

test("buildAirportPickupDispatchNote assembles a useful driver brief", () => {
  const result = buildAirportPickupDispatchNote({
    guestName: "Amina Joseph",
    airportCode: "JRO",
    pickupDateTime: "2026-09-14T09:30:00.000Z",
    destinationLabel: "Serengeti Serena Lodge",
    flightNumber: "KQ412",
    guestCount: 2,
  });

  assert.equal(result.includes("Amina Joseph"), true);
  assert.equal(result.includes("JRO"), true);
  assert.equal(result.includes("KQ412"), true);
});

test("buildAirportPickupDashboard highlights bookings that still need transfers", () => {
  const result = buildAirportPickupDashboard(
    [
      {
        _id: "booking-1",
        name: "Amina Joseph",
        packageTour: "Serengeti Explorer",
        travelDate: "2026-09-14T00:00:00.000Z",
        status: "Confirmed",
      },
    ],
    []
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].needsPickup, true);
});
