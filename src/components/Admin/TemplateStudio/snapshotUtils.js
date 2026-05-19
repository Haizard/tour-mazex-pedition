export function createSnapshotEntry({
  pageName = "Untitled Page",
  sectionLabel = "Canvas",
  sections = [],
  viewport = "desktop",
  timestamp = new Date().toISOString(),
} = {}) {
  return {
    id: `snapshot-${Date.now()}`,
    name: `${pageName} - ${sectionLabel} - ${new Date(timestamp).toLocaleString()}`,
    createdAt: timestamp,
    sections: sections.map((section) => ({ ...section })),
    viewport,
  };
}

export function prependSnapshot(snapshots = [], snapshot) {
  if (!snapshot) {
    return snapshots;
  }

  return [snapshot, ...snapshots].slice(0, 20);
}

export function renameSnapshot(snapshots = [], snapshotId, nextName) {
  const trimmedName = `${nextName || ""}`.trim();

  return snapshots.map((snapshot) =>
    snapshot.id === snapshotId && trimmedName
      ? {
          ...snapshot,
          name: trimmedName,
        }
      : snapshot
  );
}

export function deleteSnapshot(snapshots = [], snapshotId) {
  return snapshots.filter((snapshot) => snapshot.id !== snapshotId);
}

export function findSnapshot(snapshots = [], snapshotId) {
  return snapshots.find((snapshot) => snapshot.id === snapshotId) || null;
}
