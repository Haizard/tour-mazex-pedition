import test from "node:test";
import assert from "node:assert/strict";

import {
  getOperatorTrustLabel,
  getDepartureConfidenceCopy,
  getTravelerProofSummary,
  getInquiryReassuranceCopy,
} from "./marketplaceTrustUtils.js";

test("getOperatorTrustLabel prefers operator identity when available", () => {
  assert.equal(
    getOperatorTrustLabel({
      operator: { companyName: "Savannah Trails" },
    }),
    "Listed operator: Savannah Trails",
  );
});

test("getDepartureConfidenceCopy prioritizes limited departures with remaining spots", () => {
  assert.equal(
    getDepartureConfidenceCopy({
      status: "limited",
      remainingSpots: 2,
      date: "2026-08-17",
    }),
    "Limited published departure on Aug 17 with 2 spots noted.",
  );
});

test("getTravelerProofSummary returns a review-led summary when ratings exist", () => {
  assert.match(
    getTravelerProofSummary({
      averageRating: 4.8,
      reviewCount: 14,
      verificationBreakdown: { booking: 9, inquiry: 5 },
    }),
    /14 published reviews/i,
  );
});

test("getTravelerProofSummary returns a calm fallback when reviews are missing", () => {
  assert.equal(
    getTravelerProofSummary(null),
    "Traveler proof will strengthen here as verified reviews, photos, and questions grow.",
  );
});

test("getInquiryReassuranceCopy explains operator routing and request state", () => {
  assert.match(
    getInquiryReassuranceCopy(
      {
        operator: { companyName: "Savannah Trails" },
      },
      {
        status: "on-request",
      },
    ),
    /routed to Savannah Trails/i,
  );
});
