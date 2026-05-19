import test from "node:test";
import assert from "node:assert/strict";

import {
  createSnapshotEntry,
  prependSnapshot,
  renameSnapshot,
  deleteSnapshot,
  findSnapshot,
} from "./snapshotUtils.js";

test("createSnapshotEntry captures sections and viewport metadata", () => {
  const snapshot = createSnapshotEntry({
    pageName: "About Us",
    sectionLabel: "Hero",
    sections: [{ id: "hero", label: "Hero" }],
    viewport: "tablet",
    timestamp: "2026-05-19T08:00:00.000Z",
  });

  assert.match(snapshot.name, /About Us - Hero/);
  assert.equal(snapshot.viewport, "tablet");
  assert.deepEqual(snapshot.sections, [{ id: "hero", label: "Hero" }]);
});

test("prependSnapshot keeps latest snapshots first and trims to twenty", () => {
  const snapshots = Array.from({ length: 20 }, (_, index) => ({
    id: `snapshot-${index}`,
    name: `Snapshot ${index}`,
  }));

  const nextSnapshots = prependSnapshot(snapshots, { id: "snapshot-new", name: "Latest" });

  assert.equal(nextSnapshots.length, 20);
  assert.equal(nextSnapshots[0].id, "snapshot-new");
  assert.equal(nextSnapshots.at(-1).id, "snapshot-18");
});

test("renameSnapshot updates only the targeted snapshot", () => {
  const snapshots = [
    { id: "snapshot-1", name: "Old Name" },
    { id: "snapshot-2", name: "Keep Me" },
  ];

  const nextSnapshots = renameSnapshot(snapshots, "snapshot-1", "New Name");

  assert.equal(nextSnapshots[0].name, "New Name");
  assert.equal(nextSnapshots[1].name, "Keep Me");
});

test("deleteSnapshot removes the targeted snapshot and findSnapshot locates by id", () => {
  const snapshots = [
    { id: "snapshot-1", name: "First" },
    { id: "snapshot-2", name: "Second" },
  ];

  assert.equal(findSnapshot(snapshots, "snapshot-2")?.name, "Second");
  assert.equal(findSnapshot(snapshots, "missing"), null);

  const nextSnapshots = deleteSnapshot(snapshots, "snapshot-1");

  assert.deepEqual(nextSnapshots, [{ id: "snapshot-2", name: "Second" }]);
});
