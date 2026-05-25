import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAvailabilityPayload,
  buildReservationStatusPayload,
  buildServiceWindowPayload,
  buildTableTypePayload,
  formatReservationRequestSummary,
  groupReservationOperationsByRestaurant,
} from "./restaurantPartnerReservationState.js";

test("groups reservation operations by restaurant id", () => {
  const result = groupReservationOperationsByRestaurant({
    restaurants: [{ _id: "r1", name: "River Grill" }],
    operationsByRestaurant: {
      r1: { reservationRequests: [{ id: "req1", status: "pending" }] },
    },
  });

  assert.equal(result[0].restaurantId, "r1");
  assert.equal(result[0].reservationRequests.length, 1);
});

test("builds partner service window payloads", () => {
  const payload = buildServiceWindowPayload({
    label: "Dinner",
    serviceType: "dinner",
    defaultStartTime: "18:00",
  });

  assert.equal(payload.label, "Dinner");
  assert.equal(payload.serviceType, "dinner");
  assert.equal(payload.status, "active");
});

test("builds partner table type payloads", () => {
  const payload = buildTableTypePayload({ label: "Family", minGuests: "2", maxGuests: "6" });

  assert.equal(payload.minGuests, 2);
  assert.equal(payload.maxGuests, 6);
});

test("builds partner availability payloads", () => {
  const payload = buildAvailabilityPayload({ date: "2026-06-10", status: "open" });

  assert.equal(payload.date, "2026-06-10");
  assert.equal(payload.status, "open");
});

test("builds reservation status update payloads", () => {
  const payload = buildReservationStatusPayload({
    status: "confirmed",
    partnerNotes: "Confirmed with host.",
  });

  assert.equal(payload.status, "confirmed");
  assert.equal(payload.partnerNotes, "Confirmed with host.");
});

test("formats reservation request summaries", () => {
  const summary = formatReservationRequestSummary({
    travelerName: "Asha",
    guestCount: 4,
    date: "2026-06-10",
    preferredTime: "19:30",
  });

  assert.equal(summary, "Asha, 4 guests on 2026-06-10 at 19:30");
});
