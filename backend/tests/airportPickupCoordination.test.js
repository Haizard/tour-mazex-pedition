import test from "node:test";
import assert from "node:assert/strict";

import { summarizeAirportPickup } from "../utils/airportPickupCoordination.js";

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
