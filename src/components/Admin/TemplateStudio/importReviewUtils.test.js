import test from "node:test";
import assert from "node:assert/strict";

import {
  buildApprovedImportPayload,
  createImportReviewState,
  toggleImportReviewSection,
} from "./importReviewUtils.js";

const importResult = {
  sectionDrafts: [
    { id: "hero", label: "Hero", type: "hero" },
    { id: "reviews", label: "Reviews", type: "reviewWall" },
  ],
  pageDraft: {
    id: "import-page",
    sections: [
      { id: "hero", label: "Hero", type: "hero" },
      { id: "reviews", label: "Reviews", type: "reviewWall" },
    ],
  },
};

test("createImportReviewState selects all detected sections by default", () => {
  const review = createImportReviewState(importResult);

  assert.deepEqual(review.selectedSectionIds, ["hero", "reviews"]);
  assert.equal(review.totalCount, 2);
  assert.equal(review.selectedCount, 2);
});

test("toggleImportReviewSection removes and re-adds reviewed sections", () => {
  const initialReview = createImportReviewState(importResult);
  const withoutReviews = toggleImportReviewSection(initialReview, "reviews");
  const restored = toggleImportReviewSection(withoutReviews, "reviews");

  assert.deepEqual(withoutReviews.selectedSectionIds, ["hero"]);
  assert.equal(withoutReviews.selectedCount, 1);
  assert.deepEqual(restored.selectedSectionIds, ["hero", "reviews"]);
  assert.equal(restored.selectedCount, 2);
});

test("buildApprovedImportPayload keeps only explicitly selected sections", () => {
  const review = {
    selectedSectionIds: ["reviews"],
  };

  const approved = buildApprovedImportPayload(importResult, review);

  assert.equal(approved.sectionDrafts.length, 1);
  assert.equal(approved.sectionDrafts[0].id, "reviews");
  assert.equal(approved.pageDraft.sections.length, 1);
  assert.equal(approved.pageDraft.sections[0].id, "reviews");
});
