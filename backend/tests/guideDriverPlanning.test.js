import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGuideDriverDispatchBoard,
  hasAssignmentWindowConflict,
  summarizeGuideDriverAssignment,
} from "../utils/guideDriverPlanning.js";

test("summarizeGuideDriverAssignment highlights assigned staff clearly", () => {
  const result = summarizeGuideDriverAssignment({
    fullName: "Moses Lemala",
    staffType: "guide",
    availabilityStatus: "assigned",
    assignedTourTitle: "Northern Circuit Safari",
    assignmentDate: "2026-08-14T00:00:00.000Z",
  });

  assert.equal(result.badgeLabel, "Assigned");
  assert.equal(result.summary.includes("Northern Circuit Safari"), true);
  assert.equal(result.summary.includes("August"), true);
});

test("summarizeGuideDriverAssignment handles available staff without assignments", () => {
  const result = summarizeGuideDriverAssignment({
    fullName: "Neema Julius",
    staffType: "driver",
    availabilityStatus: "available",
  });

  assert.equal(result.badgeLabel, "Available");
  assert.equal(result.summary.includes("ready for assignment"), true);
});

test("hasAssignmentWindowConflict detects overlapping assignment windows", () => {
  const result = hasAssignmentWindowConflict(
    {
      assignmentStartDate: "2026-08-14T00:00:00.000Z",
      assignmentEndDate: "2026-08-16T00:00:00.000Z",
    },
    {
      assignmentStartDate: "2026-08-15T00:00:00.000Z",
      assignmentEndDate: "2026-08-17T00:00:00.000Z",
    }
  );

  assert.equal(result, true);
});

test("buildGuideDriverDispatchBoard highlights coverage gaps", () => {
  const result = buildGuideDriverDispatchBoard(
    [
      {
        _id: "booking-1",
        name: "Anna Safari",
        packageTour: "Serengeti Explorer",
        travelDate: "2026-08-14T00:00:00.000Z",
        status: "Confirmed",
      },
    ],
    [
      {
        _id: "guide-1",
        fullName: "Moses Lemala",
        staffType: "guide",
        assignedBookingId: "booking-1",
      },
    ]
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].needsGuide, false);
  assert.equal(result[0].needsDriver, true);
});
