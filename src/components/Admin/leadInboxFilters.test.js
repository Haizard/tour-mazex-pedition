import test from "node:test";
import assert from "node:assert/strict";

import {
  filterLeadInboxItems,
  readLeadInboxFiltersFromSearchParams,
} from "./leadInboxFilters.js";

test("readLeadInboxFiltersFromSearchParams recognizes marketplace source and campaign", () => {
  const params = new URLSearchParams("source=global-marketplace&campaign=tour_tour1");
  const filters = readLeadInboxFiltersFromSearchParams(params);

  assert.equal(filters.source, "global-marketplace");
  assert.equal(filters.campaign, "tour_tour1");
});

test("filterLeadInboxItems narrows leads to marketplace campaign", () => {
  const results = filterLeadInboxItems(
    [
      {
        _id: "inq1",
        status: "Contacted",
        sourceChannel: "global-marketplace",
        campaignLabel: "tour_tour1",
      },
      {
        _id: "inq2",
        status: "Pending",
        sourceChannel: "website",
        campaignLabel: "",
      },
    ],
    {
      status: "all",
      source: "global-marketplace",
      campaign: "tour_tour1",
    }
  );

  assert.equal(results.length, 1);
  assert.equal(results[0]._id, "inq1");
});
