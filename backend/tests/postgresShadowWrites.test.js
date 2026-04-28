import test from "node:test";
import assert from "node:assert/strict";

import {
  buildShadowEntitySnapshot,
  buildShadowUpsertStatement,
  syncShadowEntity,
} from "../utils/postgresShadowWrites.js";

test("buildShadowEntitySnapshot creates a canonical snapshot envelope", () => {
  const snapshot = buildShadowEntitySnapshot("bookings", {
    _id: "booking-1",
    tenantId: "tenant-1",
    createdAt: "2026-04-28T00:00:00.000Z",
    updatedAt: "2026-04-29T00:00:00.000Z",
    name: "Amina",
  });

  assert.equal(snapshot.entityType, "bookings");
  assert.equal(snapshot.sourceId, "booking-1");
  assert.equal(snapshot.canonicalId, "bookings:booking-1");
  assert.equal(snapshot.payload.name, "Amina");
});

test("buildShadowUpsertStatement targets the generic snapshot table", () => {
  const statement = buildShadowUpsertStatement({
    entityType: "payments",
    sourceId: "pay-1",
    tenantId: "tenant-1",
    canonicalId: "payments:pay-1",
    payload: { amount: 1200 },
    sourceCreatedAt: null,
    sourceUpdatedAt: null,
  });

  assert.equal(statement.text.includes("shadow_entity_snapshots"), true);
  assert.equal(statement.values[0], "payments");
  assert.equal(statement.values[1], "pay-1");
});

test("syncShadowEntity marks a successful shadow write as shadowed", async () => {
  const result = await syncShadowEntity({
    entityType: "quotes",
    record: {
      _id: "quote-1",
      tenantId: "tenant-1",
      businessTruth: { truthVersion: 1 },
    },
    env: { SUPABASE_DB_URL: "postgres://example" },
    upsertShadow: async () => {},
    enqueue: async () => false,
  });

  assert.equal(result.ok, true);
  assert.equal(result.businessTruthPatch.migrationStatus, "shadowed");
  assert.equal(result.businessTruthPatch.lastShadowError, "");
});

test("syncShadowEntity falls back to queueing when the shadow write fails", async () => {
  const result = await syncShadowEntity({
    entityType: "payments",
    record: {
      _id: "payment-1",
      tenantId: "tenant-1",
      businessTruth: { truthVersion: 2 },
    },
    env: { SUPABASE_DB_URL: "postgres://example" },
    upsertShadow: async () => {
      throw new Error("getaddrinfo ENOTFOUND");
    },
    enqueue: async () => true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.enqueued, true);
  assert.equal(result.businessTruthPatch.migrationStatus, "pending");
  assert.equal(result.businessTruthPatch.lastShadowError.includes("ENOTFOUND"), true);
});
