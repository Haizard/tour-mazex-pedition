import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const routeSource = readFileSync(
  new URL("../routes/marketplaceRoutes.js", import.meta.url),
  "utf8"
);

const modelSource = readFileSync(
  new URL("../models/TourismLeadCandidate.js", import.meta.url),
  "utf8"
);

test("marketplace exposes compliant tourism lead discovery endpoints", () => {
  assert.match(routeSource, /TourismLeadCandidate/);
  assert.match(routeSource, /analyzeTourismLeadSource/);
  assert.match(routeSource, /router\.post\("\/lead-discovery\/analyze"/);
  assert.match(routeSource, /router\.get\("\/lead-discovery\/candidates"/);
});

test("TourismLeadCandidate stores compliance and source attribution fields", () => {
  assert.match(modelSource, /sourceUrl/);
  assert.match(modelSource, /officialWebsiteUrl/);
  assert.match(modelSource, /allowedContacts/);
  assert.match(modelSource, /blockedContacts/);
  assert.match(modelSource, /sourcePolicy/);
  assert.match(modelSource, /outreachStatus/);
});
