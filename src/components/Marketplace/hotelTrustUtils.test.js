import test from "node:test";
import assert from "node:assert/strict";

import {
  getHotelFitExplanation,
  getHotelTrustLabel,
  getHotelTrustSummary,
} from "./hotelTrustUtils.js";

test("getHotelTrustLabel summarizes rating without inventing verification", () => {
  assert.equal(
    getHotelTrustLabel({ averageRating: 4.8, reviewCount: 12 }),
    "4.8/5 from 12 reviews"
  );
});

test("getHotelTrustSummary falls back when trust signals are thin", () => {
  assert.equal(
    getHotelTrustSummary({ name: "New Lodge" }),
    "Trust signals will grow here as reviews, partner history, and traveler proof are added."
  );
});

test("getHotelFitExplanation uses known fields only", () => {
  const explanation = getHotelFitExplanation({
    name: "Arusha Garden Lodge",
    destination: "Arusha",
    accommodationType: "lodge",
    roomStyleSummary: "quiet garden rooms",
    amenities: ["Airport transfer", "Pool"],
  });

  assert.equal(explanation.includes("Arusha"), true);
  assert.equal(explanation.includes("lodge"), true);
  assert.equal(explanation.includes("Airport transfer"), true);
});
