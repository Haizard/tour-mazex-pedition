import test from "node:test";
import assert from "node:assert/strict";

import { compareSnapshots } from "./snapshotDiffUtils.js";

test("compareSnapshots summarizes added, removed, and changed sections", () => {
  const diff = compareSnapshots({
    leftSnapshot: {
      id: "snapshot-left",
      name: "Before",
      sections: [
        { id: "hero", label: "Hero", content: { title: "Old hero" }, styles: { accentColor: "#0f766e" } },
        { id: "faq", label: "FAQ", content: { title: "FAQ" } },
      ],
    },
    rightSnapshot: {
      id: "snapshot-right",
      name: "After",
      sections: [
        { id: "hero", label: "Hero", content: { title: "New hero" }, styles: { accentColor: "#2563eb" } },
        { id: "gallery", label: "Gallery", content: { title: "Gallery" } },
      ],
    },
  });

  assert.equal(diff.summary.added, 1);
  assert.equal(diff.summary.removed, 1);
  assert.equal(diff.summary.changed, 1);
  assert.equal(diff.rows.find((row) => row.sectionId === "hero")?.changeType, "changed");
  assert.equal(diff.rows.find((row) => row.sectionId === "faq")?.changeType, "removed");
  assert.equal(diff.rows.find((row) => row.sectionId === "gallery")?.changeType, "added");
});
