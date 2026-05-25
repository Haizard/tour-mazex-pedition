import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRestaurantReservationPayload,
  getReservationAvailabilityTone,
  normalizeReservationOptions,
  validateReservationRequestForm,
} from "./restaurantReservationState.js";

test("normalizes public reservation options into select-friendly values", () => {
  const result = normalizeReservationOptions({
    serviceWindows: [{ id: "dinner", label: "Dinner", defaultStartTime: "18:00" }],
    tableTypes: [{ id: "family", label: "Family table", minGuests: 2, maxGuests: 6 }],
    availabilitySummary: { status: "limited", totalAvailableSeats: 8 },
  });

  assert.equal(result.serviceWindows[0].value, "dinner");
  assert.equal(result.tableTypes[0].label, "Family table (2-6 guests)");
  assert.equal(result.availabilitySummary.status, "limited");
});

test("validates required public reservation fields", () => {
  const errors = validateReservationRequestForm({
    travelerName: "",
    travelerEmail: "",
    date: "",
    preferredTime: "",
    guestCount: 0,
  });

  assert.equal(errors.travelerName, "Name is required.");
  assert.equal(errors.travelerEmail, "Email is required.");
  assert.equal(errors.date, "Date is required.");
  assert.equal(errors.preferredTime, "Preferred time is required.");
  assert.equal(errors.guestCount, "Guest count must be at least 1.");
});

test("builds direct reservation request payload", () => {
  const payload = buildRestaurantReservationPayload({
    travelerName: "Asha",
    travelerEmail: "asha@example.com",
    date: "2026-06-10",
    preferredTime: "19:00",
    guestCount: "4",
  });

  assert.equal(payload.source, "direct");
  assert.equal(payload.guestCount, 4);
});

test("preserves itinerary context in reservation payloads", () => {
  const payload = buildRestaurantReservationPayload(
    {
      travelerName: "Asha",
      travelerEmail: "asha@example.com",
      date: "2026-06-10",
      preferredTime: "19:00",
      guestCount: 2,
    },
    { source: "itinerary", itineraryContext: { packageId: "pkg_1" } }
  );

  assert.equal(payload.source, "itinerary");
  assert.equal(payload.itineraryContext.packageId, "pkg_1");
});

test("returns compact availability tones", () => {
  assert.equal(getReservationAvailabilityTone("open").label, "Open");
  assert.equal(getReservationAvailabilityTone("closed").tone, "closed");
});
