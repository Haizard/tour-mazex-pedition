import test from "node:test";
import assert from "node:assert/strict";

import {
  createDropTargets,
  resolveReorderDropIndex,
} from "./canvasDnd.js";

const sections = [{ id: "hero" }, { id: "story" }, { id: "reviews" }];

test("createDropTargets exposes before and after drop zones for each canvas section", () => {
  const targets = createDropTargets(sections);

  assert.deepEqual(
    targets.map((target) => target.id),
    ["drop-before-hero", "drop-before-story", "drop-before-reviews", "drop-end"],
  );
  assert.equal(targets[0].toIndex, 0);
  assert.equal(targets[2].toIndex, 2);
  assert.equal(targets[3].toIndex, 3);
});

test("resolveReorderDropIndex preserves intuitive drag positions when moving downward", () => {
  const toIndex = resolveReorderDropIndex({
    sections,
    draggedSectionId: "hero",
    rawTargetIndex: 2,
  });

  assert.equal(toIndex, 1);
});

test("resolveReorderDropIndex keeps upward drags on the requested insertion slot", () => {
  const toIndex = resolveReorderDropIndex({
    sections,
    draggedSectionId: "reviews",
    rawTargetIndex: 1,
  });

  assert.equal(toIndex, 1);
});

test("resolveReorderDropIndex returns null for no-op drops", () => {
  const toIndex = resolveReorderDropIndex({
    sections,
    draggedSectionId: "story",
    rawTargetIndex: 1,
  });

  assert.equal(toIndex, null);
});
