import test from "node:test";
import assert from "node:assert/strict";

import {
  buildShadowRecordSnapshot,
  createBusinessTruthMetadataDefaults,
  markBusinessTruthSyncCompleted,
  markBusinessTruthSyncPending,
} from "../utils/businessTruthSync.js";

test("createBusinessTruthMetadataDefaults creates a shadow-prep baseline", () => {
  const metadata = createBusinessTruthMetadataDefaults({ entityKey: "bookings" });

  assert.equal(metadata.entityKey, "bookings");
  assert.equal(metadata.currentOwner, "mongodb");
  assert.equal(metadata.targetOwner, "postgresql");
  assert.equal(metadata.migrationStatus, "not-started");
});

test("markBusinessTruthSyncPending enables shadow writes and increments version", () => {
  const metadata = markBusinessTruthSyncPending({
    entityKey: "payments",
    truthVersion: 2,
  });

  assert.equal(metadata.migrationStatus, "pending");
  assert.equal(metadata.shadowWriteEnabled, true);
  assert.equal(metadata.truthVersion, 3);
});

test("markBusinessTruthSyncCompleted stamps shadow sync progress", () => {
  const lastShadowSyncAt = new Date("2026-04-28T08:00:00.000Z");
  const metadata = markBusinessTruthSyncCompleted(
    {
      entityKey: "quotes",
      truthVersion: 4,
    },
    { lastShadowSyncAt }
  );

  assert.equal(metadata.migrationStatus, "shadowed");
  assert.equal(metadata.lastShadowSyncAt, lastShadowSyncAt);
  assert.equal(metadata.shadowWriteEnabled, true);
});

test("buildShadowRecordSnapshot packages the canonical migration payload", () => {
  const snapshot = buildShadowRecordSnapshot(
    {
      entityKey: "guide-driver-assignments",
      currentOwner: "mongodb",
      targetOwner: "postgresql",
      migrationStatus: "pending",
      truthVersion: 2,
    },
    {
      assignedTourTitle: "Northern Circuit Safari",
    }
  );

  assert.equal(snapshot.entityKey, "guide-driver-assignments");
  assert.equal(snapshot.payload.assignedTourTitle, "Northern Circuit Safari");
  assert.equal(snapshot.truthVersion, 2);
});
