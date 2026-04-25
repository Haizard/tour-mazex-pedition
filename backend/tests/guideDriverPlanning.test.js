import test from "node:test";
import assert from "node:assert/strict";

import { summarizeGuideDriverAssignment } from "../utils/guideDriverPlanning.js";

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
