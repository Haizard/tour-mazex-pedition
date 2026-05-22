import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelInventorySummary,
  normalizeHotelAvailabilityEntries,
  normalizeHotelInventoryPayload,
} from "../utils/hotelInventory.js";

test("normalizeHotelInventoryPayload shapes room types and settings", () => {
  const payload = normalizeHotelInventoryPayload({
    roomInventory: [
      {
        roomTypeCode: " deluxe ",
        label: " Deluxe Room ",
        capacity: "2",
        totalUnits: "6",
        baseNightlyRate: "180",
        currency: "usd",
        boardBasis: "Bed & Breakfast",
      },
    ],
    inventorySettings: {
      defaultCurrency: "usd",
      defaultStatus: "open",
      monthsAhead: "4",
      autoExtendCalendar: true,
      checkInCutoffDays: "2",
    },
  });

  assert.equal(payload.roomInventory[0].roomTypeCode, "deluxe");
  assert.equal(payload.roomInventory[0].label, "Deluxe Room");
  assert.equal(payload.roomInventory[0].capacity, 2);
  assert.equal(payload.roomInventory[0].totalUnits, 6);
  assert.equal(payload.roomInventory[0].baseNightlyRate, 180);
  assert.equal(payload.roomInventory[0].currency, "USD");
  assert.equal(payload.inventorySettings.monthsAhead, 4);
  assert.equal(payload.inventorySettings.checkInCutoffDays, 2);
});

test("normalizeHotelAvailabilityEntries shapes dated room availability rows", () => {
  const entries = normalizeHotelAvailabilityEntries([
    {
      date: "2026-07-10",
      roomTypeCode: "deluxe",
      status: "limited",
      availableUnits: "2",
      nightlyRate: "220",
      minStay: "2",
      note: "Two rooms left",
    },
  ]);

  assert.equal(entries[0].roomTypeCode, "deluxe");
  assert.equal(entries[0].status, "limited");
  assert.equal(entries[0].availableUnits, 2);
  assert.equal(entries[0].nightlyRate, 220);
  assert.equal(entries[0].minStay, 2);
});

test("buildHotelInventorySummary exposes next open date and entry counts", () => {
  const summary = buildHotelInventorySummary({
    roomInventory: [{ roomTypeCode: "deluxe", label: "Deluxe Room" }],
    availabilityCalendar: [
      { date: "2026-07-10", roomTypeCode: "deluxe", status: "sold-out", availableUnits: 0 },
      { date: "2026-07-12", roomTypeCode: "deluxe", status: "open", availableUnits: 3, nightlyRate: 210 },
    ],
  });

  assert.equal(summary.roomTypeCount, 1);
  assert.equal(summary.totalEntries, 2);
  assert.equal(String(summary.nextAvailableDate).slice(0, 10), "2026-07-12");
  assert.equal(summary.nextStatusLabel, "Open");
  assert.equal(summary.fromRate, 210);
});
