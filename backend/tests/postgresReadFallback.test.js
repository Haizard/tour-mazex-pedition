import test from "node:test";
import assert from "node:assert/strict";

import {
  preferPrimaryCollection,
  preferPrimaryDashboard,
} from "../utils/postgresReadFallback.js";

test("preferPrimaryCollection keeps postgres rows when they exist", () => {
  const result = preferPrimaryCollection([{ _id: "pg-1" }], [{ _id: "mongo-1" }]);
  assert.deepEqual(result, [{ _id: "pg-1" }]);
});

test("preferPrimaryCollection falls back to legacy rows when postgres is empty", () => {
  const result = preferPrimaryCollection([], [{ _id: "mongo-1" }]);
  assert.deepEqual(result, [{ _id: "mongo-1" }]);
});

test("preferPrimaryDashboard keeps postgres payload when collection has rows", () => {
  const result = preferPrimaryDashboard(
    { reservations: [{ _id: "pg-1" }], stats: { total: 1 } },
    { reservations: [{ _id: "mongo-1" }], stats: { total: 1 } },
    "reservations"
  );

  assert.deepEqual(result, { reservations: [{ _id: "pg-1" }], stats: { total: 1 } });
});

test("preferPrimaryDashboard falls back to legacy payload when postgres collection is empty", () => {
  const result = preferPrimaryDashboard(
    { reservations: [], stats: { total: 0 } },
    { reservations: [{ _id: "mongo-1" }], stats: { total: 1 } },
    "reservations"
  );

  assert.deepEqual(result, { reservations: [{ _id: "mongo-1" }], stats: { total: 1 } });
});
