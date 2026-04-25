import test from "node:test";
import assert from "node:assert/strict";

import { summarizeAccommodationReservation } from "../utils/accommodationCoordination.js";

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
