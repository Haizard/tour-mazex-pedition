import test from "node:test";
import assert from "node:assert/strict";

import { findMatchingToursForInquiry, generateQuoteProposal } from "../utils/quoteProposal.js";

test("findMatchingToursForInquiry ranks destination-relevant tours first", () => {
  const matches = findMatchingToursForInquiry(
    { destinations: ["Serengeti"] },
    [
      { _id: "1", title: "Zanzibar Escape", location: "Zanzibar", price: 900 },
      { _id: "2", title: "Serengeti Explorer", location: "Serengeti", price: 1800 },
    ]
  );

  assert.equal(matches[0]._id, "2");
  assert.equal(matches[0].matchScore > matches[1].matchScore, true);
});

test("generateQuoteProposal creates priced line items and next steps", () => {
  const quote = generateQuoteProposal({
    inquiry: {
      name: "Amina Joseph",
      destinations: ["Serengeti", "Ngorongoro"],
      tripLengthDays: 6,
      adults: 2,
      travelWhen: "July 2026",
      services: ["airport pickup"],
      sourceChannel: "global-marketplace",
      campaignLabel: "tour_tour-1",
    },
    tours: [
      { _id: "a", title: "Serengeti Fly-In", location: "Serengeti", price: 2200, itinerary: [] },
      { _id: "b", title: "Ngorongoro Highlights", location: "Ngorongoro", price: 1800, itinerary: [] },
    ],
    tenantName: "Mazex",
    generatedBy: "admin",
  });

  assert.equal(quote.lineItems.length >= 2, true);
  assert.equal(quote.totalPrice > 0, true);
  assert.equal(quote.recommendedTourIds.length > 0, true);
  assert.equal(quote.nextSteps.length > 0, true);
  assert.equal(quote.generationMeta.leadSource, "global-marketplace");
  assert.equal(quote.generationMeta.campaignLabel, "tour_tour-1");
});
