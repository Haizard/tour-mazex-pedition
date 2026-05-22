import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelClaimReviewPayload,
  filterHotelClaimRows,
} from "./hotelClaimManagerState.js";

test("filterHotelClaimRows narrows by text and status", () => {
  const rows = filterHotelClaimRows(
    [
      {
        hotelNameSnapshot: "Arusha Garden Lodge",
        claimantName: "Jane Doe",
        claimantEmail: "jane@example.com",
        status: "pending",
      },
      {
        hotelNameSnapshot: "Serengeti Camp",
        claimantName: "Asha",
        claimantEmail: "asha@example.com",
        status: "approved",
      },
    ],
    { search: "arusha", status: "pending" }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].hotelNameSnapshot, "Arusha Garden Lodge");
});

test("buildHotelClaimReviewPayload keeps review actions explicit", () => {
  assert.deepEqual(buildHotelClaimReviewPayload("approve"), {
    action: "approve",
    reviewNote: "",
  });

  assert.deepEqual(buildHotelClaimReviewPayload("needs-more-proof", "Use a work email."), {
    action: "needs-more-proof",
    reviewNote: "Use a work email.",
  });
});
