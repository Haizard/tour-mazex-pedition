import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantClaimReviewPayload,
  filterRestaurantClaimRows,
} from "./restaurantClaimManagerState.js";

test("filterRestaurantClaimRows narrows by text and status", () => {
  const rows = filterRestaurantClaimRows(
    [
      {
        restaurantNameSnapshot: "Savanna Table",
        destinationSnapshot: "Arusha",
        claimantName: "Jane Doe",
        claimantEmail: "jane@example.com",
        requestedUsername: "savanna.table",
        status: "pending",
      },
      {
        restaurantNameSnapshot: "Coast Spice House",
        destinationSnapshot: "Zanzibar",
        claimantName: "Asha",
        claimantEmail: "asha@example.com",
        requestedUsername: "coast.spice",
        status: "approved",
      },
    ],
    { search: "savanna", status: "pending" }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].restaurantNameSnapshot, "Savanna Table");
});

test("buildRestaurantClaimReviewPayload keeps review actions explicit", () => {
  assert.deepEqual(buildRestaurantClaimReviewPayload("approve"), {
    action: "approve",
    reviewNote: "",
  });

  assert.deepEqual(
    buildRestaurantClaimReviewPayload("needs-more-proof", "Need a verifiable work profile."),
    {
      action: "needs-more-proof",
      reviewNote: "Need a verifiable work profile.",
    }
  );
});
