import assert from "node:assert/strict";
import test from "node:test";

import { countActiveDiscoveryFilters } from "./discoveryFilterUtils.js";

test("countActiveDiscoveryFilters ignores default sort and counts populated filters", () => {
  assert.equal(
    countActiveDiscoveryFilters({
      q: "serengeti",
      location: "",
      category: "Luxury",
      operator: "",
      duration: "",
      availability: "instant",
      departureMonth: "",
      minPrice: "",
      maxPrice: "5000",
      sort: "featured",
    }),
    4,
  );
});

test("countActiveDiscoveryFilters returns zero for untouched filters", () => {
  assert.equal(
    countActiveDiscoveryFilters({
      q: "",
      location: "",
      category: "",
      operator: "",
      duration: "",
      availability: "",
      departureMonth: "",
      minPrice: "",
      maxPrice: "",
      sort: "featured",
    }),
    0,
  );
});
