import assert from "node:assert/strict";
import test from "node:test";
import {
  getReservationAutopilotBadge,
  getReservationStatusLabel,
  shapeRestaurantReservationOperations,
  summarizeRestaurantReservationRequests,
} from "./restaurantReservationAdminState.js";

test("summarizes restaurant reservation requests by status", () => {
  const summary = summarizeRestaurantReservationRequests([
    { status: "pending" },
    { status: "confirmed" },
    { status: "needs-clarification" },
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.pending, 1);
  assert.equal(summary.confirmed, 1);
  assert.equal(summary.needsClarification, 1);
});

test("shapes restaurant reservation operations for admin UI", () => {
  const shaped = shapeRestaurantReservationOperations({
    serviceWindows: [{ id: "dinner" }],
    reservationRequests: [{ id: "req1", status: "pending" }],
  });

  assert.equal(shaped.summary.pending, 1);
  assert.equal(shaped.serviceWindows.length, 1);
});

test("formats reservation status and autopilot badges", () => {
  assert.equal(getReservationStatusLabel("needs-clarification"), "Needs clarification");
  assert.equal(
    getReservationAutopilotBadge({ classification: "group-dining", requiresHumanReview: true }),
    "Group dining / review"
  );
});
