import assert from "node:assert/strict";
import test from "node:test";

import {
  getMarketplaceQuoteContext,
  getQuoteStatusLabel,
} from "./quotePublicViewUtils.js";

test("getQuoteStatusLabel returns traveler-friendly labels", () => {
  assert.equal(getQuoteStatusLabel("sent"), "Awaiting traveler response");
  assert.equal(getQuoteStatusLabel("accepted"), "Accepted");
  assert.equal(getQuoteStatusLabel("rejected"), "Changes requested");
  assert.equal(getQuoteStatusLabel("draft"), "Draft proposal");
});

test("getMarketplaceQuoteContext only returns context for marketplace-origin quotes", () => {
  assert.equal(getMarketplaceQuoteContext({ leadSource: "website" }), null);
  assert.deepEqual(
    getMarketplaceQuoteContext({
      leadSource: "global-marketplace",
      campaignLabel: "tour_tour-9",
    }),
    {
      eyebrow: "Marketplace inquiry",
      title: "This proposal came from a marketplace trip request.",
      detail: "The operator is responding to the traveler journey that started on tour_tour-9.",
    },
  );
});
