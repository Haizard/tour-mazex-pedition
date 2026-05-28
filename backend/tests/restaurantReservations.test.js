import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReservationAutopilot,
  normalizeAvailabilityPayload,
  normalizeReservationRequestPayload,
  normalizeServiceWindowPayload,
  normalizeTableTypePayload,
  shapeReservationRequest,
  shapePublicReservationOptions,
  summarizeRestaurantAvailability,
} from "../utils/restaurantReservations.js";

test("normalizes restaurant service windows with safe defaults", () => {
  const result = normalizeServiceWindowPayload({
    label: "Dinner",
    serviceType: "dinner",
    defaultStartTime: "18:00",
    defaultEndTime: "22:00",
  });

  assert.equal(result.label, "Dinner");
  assert.equal(result.serviceType, "dinner");
  assert.equal(result.capacityMode, "table_type");
  assert.equal(result.status, "active");
});

test("normalizes table types and clamps invalid capacity values", () => {
  const result = normalizeTableTypePayload({
    label: "Family table",
    minGuests: 0,
    maxGuests: 6,
    quantity: 2,
  });

  assert.equal(result.minGuests, 1);
  assert.equal(result.maxGuests, 6);
  assert.equal(result.quantity, 2);
  assert.equal(result.status, "active");
});

test("normalizes availability entries with date and status rules", () => {
  const result = normalizeAvailabilityPayload({
    date: "2026-06-10",
    status: "limited",
    availableUnits: 1,
    availableSeats: 4,
  });

  assert.equal(result.date, "2026-06-10");
  assert.equal(result.status, "limited");
  assert.equal(result.availableUnits, 1);
  assert.equal(result.availableSeats, 4);
});

test("normalizes reservation requests with pending status and direct source", () => {
  const result = normalizeReservationRequestPayload({
    travelerName: "Asha Traveler",
    travelerEmail: "asha@example.com",
    date: "2026-06-10",
    preferredTime: "19:30",
    guestCount: 4,
  });

  assert.equal(result.travelerName, "Asha Traveler");
  assert.equal(result.source, "direct");
  assert.equal(result.status, "pending");
});

test("normalizeReservationRequestPayload preserves menu interest", () => {
  const payload = normalizeReservationRequestPayload({
    travelerName: "Amina",
    travelerEmail: "AMINA@example.com",
    date: "2026-06-01",
    preferredTime: "19:00",
    guestCount: 10,
    selectedMenuItemIds: [" item_1 ", "item_2", ""],
    selectedMenuItems: [{ itemId: "item_1", name: "Group Platter", price: 45, currency: "USD" }],
    groupMealNotes: "Birthday group",
    preorderInterest: true,
  });

  assert.deepEqual(payload.selectedMenuItemIds, ["item_1", "item_2"]);
  assert.equal(payload.selectedMenuItems[0].name, "Group Platter");
  assert.equal(payload.groupMealNotes, "Birthday group");
  assert.equal(payload.preorderInterest, true);
});

test("shapeReservationRequest exposes menu interest to partners and admins", () => {
  const shaped = shapeReservationRequest({
    _id: "req_1",
    restaurantId: "restaurant_1",
    travelerName: "Amina",
    travelerEmail: "amina@example.com",
    date: "2026-06-01",
    preferredTime: "19:00",
    guestCount: 10,
    selectedMenuItemIds: ["item_1"],
    selectedMenuItems: [{ itemId: "item_1", name: "Group Platter" }],
    groupMealNotes: "Birthday group",
    preorderInterest: true,
  });

  assert.deepEqual(shaped.selectedMenuItemIds, ["item_1"]);
  assert.equal(shaped.selectedMenuItems[0].name, "Group Platter");
  assert.equal(shaped.groupMealNotes, "Birthday group");
  assert.equal(shaped.preorderInterest, true);
});

test("summarizes availability for public reservation options", () => {
  const summary = summarizeRestaurantAvailability([
    { status: "open", availableUnits: 3, availableSeats: 12 },
    { status: "limited", availableUnits: 1, availableSeats: 4 },
  ]);

  assert.equal(summary.status, "open");
  assert.equal(summary.totalAvailableUnits, 4);
  assert.equal(summary.totalAvailableSeats, 16);
});

test("builds reservation autopilot metadata for group and dietary requests", () => {
  const result = buildReservationAutopilot({
    guestCount: 12,
    dietaryNotes: "Vegetarian options needed",
    occasion: "family dinner",
  });

  assert.equal(result.classification, "group-dining");
  assert.equal(result.requiresHumanReview, true);
  assert.match(result.nextBestAction, /confirm/i);
});

test("shapes public reservation options without leaking archived records", () => {
  const result = shapePublicReservationOptions({
    serviceWindows: [
      { _id: "service-open", label: "Dinner", serviceType: "dinner", status: "active" },
      { _id: "service-archived", label: "Old brunch", status: "archived" },
    ],
    tableTypes: [
      { _id: "table-family", label: "Family table", minGuests: 2, maxGuests: 6, status: "active" },
      { _id: "table-paused", label: "Paused room", status: "paused" },
    ],
    availabilityEntries: [
      { date: "2026-06-10", status: "open", availableUnits: 2, availableSeats: 8 },
      { date: "2026-06-11", status: "closed", availableUnits: 0, availableSeats: 0 },
    ],
  });

  assert.equal(result.serviceWindows.length, 1);
  assert.equal(result.tableTypes.length, 1);
  assert.equal(result.availabilitySummary.status, "open");
});
