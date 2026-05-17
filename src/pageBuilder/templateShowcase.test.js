import test from "node:test";
import assert from "node:assert/strict";

import { getShowcaseFilters, resolveShowcaseTemplates } from "./templateShowcase.js";

const templates = [
  {
    id: "safari",
    name: "Safari Signature Home",
    category: "Safari Operator",
    purchaseStatus: "purchased",
    bestFor: ["Luxury safari brands"],
    featuredRank: 3,
  },
  {
    id: "island",
    name: "Island Escape Landing",
    category: "Beach & Islands",
    purchaseStatus: "available",
    bestFor: ["Honeymoon offers"],
    featuredRank: 1,
  },
];

test("getShowcaseFilters includes all categories and purchased", () => {
  assert.deepEqual(getShowcaseFilters(templates), [
    "All",
    "Purchased",
    "Safari Operator",
    "Beach & Islands",
  ]);
});

test("resolveShowcaseTemplates searches, filters, and sorts templates", () => {
  const result = resolveShowcaseTemplates(templates, {
    query: "luxury",
    filter: "Purchased",
    sort: "Popular",
  });

  assert.deepEqual(result.map((template) => template.id), ["safari"]);
});
