import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAvailabilityBulkPayload,
  buildDrawerDraft,
  filterAvailabilityRows,
  toggleAvailabilitySelection,
} from "./availabilityManagerState.js";

const sampleRows = [
  {
    rowId: "tour1:2026-08-10",
    tourId: "tour1",
    packageTitle: "Migration Safari",
    location: "Serengeti",
    dateKey: "2026-08-10",
    status: "available",
    instantReady: true,
    requestOnly: false,
    note: "Guaranteed",
  },
  {
    rowId: "tour1:2026-08-17",
    tourId: "tour1",
    packageTitle: "Migration Safari",
    location: "Serengeti",
    dateKey: "2026-08-17",
    status: "on-request",
    instantReady: false,
    requestOnly: true,
    note: "Flexible",
  },
];

test("filterAvailabilityRows applies status and search filters", () => {
  const rows = filterAvailabilityRows(sampleRows, {
    status: "on-request",
    search: "flex",
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].dateKey, "2026-08-17");
});

test("toggleAvailabilitySelection adds and removes row ids", () => {
  const once = toggleAvailabilitySelection([], "row-1");
  const twice = toggleAvailabilitySelection(once, "row-1");

  assert.deepEqual(once, ["row-1"]);
  assert.deepEqual(twice, []);
});

test("buildAvailabilityBulkPayload groups selected rows into one package action", () => {
  const result = buildAvailabilityBulkPayload({
    action: "set-status",
    rowIds: ["tour1:2026-08-10", "tour1:2026-08-17"],
    rows: sampleRows,
    status: "limited",
  });

  assert.equal(result.tourId, "tour1");
  assert.deepEqual(result.payload.dateKeys, ["2026-08-10", "2026-08-17"]);
  assert.equal(result.payload.status, "limited");
});

test("buildDrawerDraft normalizes entry editing state", () => {
  const draft = buildDrawerDraft({
    date: "2026-08-10T00:00:00.000Z",
    status: "limited",
    published: false,
    remainingSpots: 3,
    note: "Almost full",
  });

  assert.equal(draft.date, "2026-08-10");
  assert.equal(draft.status, "limited");
  assert.equal(draft.published, false);
  assert.equal(draft.remainingSpots, 3);
});
