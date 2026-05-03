import test from "node:test";
import assert from "node:assert/strict";

import { summarizeTravelDocumentationGuide } from "../utils/travelDocumentationAssistant.js";

test("summarizeTravelDocumentationGuide highlights active requirement guides", () => {
  const result = summarizeTravelDocumentationGuide({
    market: "France",
    topic: "Visa",
    status: "active",
  });

  assert.equal(result.badgeLabel, "Active");
  assert.equal(result.summary.includes("France"), true);
  assert.equal(result.summary.includes("Visa"), true);
});

test("summarizeTravelDocumentationGuide highlights draft requirements", () => {
  const result = summarizeTravelDocumentationGuide({
    market: "Germany",
    topic: "Vaccines",
    status: "draft",
  });

  assert.equal(result.badgeLabel, "Draft");
  assert.equal(result.summary.includes("still being prepared"), true);
});
