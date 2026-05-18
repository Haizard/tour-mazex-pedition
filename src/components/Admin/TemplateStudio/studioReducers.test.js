import test from "node:test";
import assert from "node:assert/strict";

import {
  createStudioCanvasState,
  createStudioSectionNode,
  studioCanvasReducer,
} from "./studioReducers.js";

function makeSection(id, overrides = {}) {
  return createStudioSectionNode({
    id,
    label: `Section ${id}`,
    summary: `Summary ${id}`,
    ...overrides,
  });
}

function reduce(state, action) {
  return studioCanvasReducer(state, action);
}

test("inserts a new section above the target section", () => {
  const state = createStudioCanvasState({
    sections: [makeSection("hero"), makeSection("story")],
  });

  const nextState = reduce(state, {
    type: "insert-section",
    targetSectionId: "story",
    position: "above",
    section: makeSection("proof"),
  });

  assert.deepEqual(
    nextState.sections.map((section) => section.id),
    ["hero", "proof", "story"],
  );
});

test("inserts a new section below the target section and selects it", () => {
  const state = createStudioCanvasState({
    sections: [makeSection("hero"), makeSection("story")],
    selectedSectionId: "story",
  });

  const nextState = reduce(state, {
    type: "insert-section",
    targetSectionId: "hero",
    position: "below",
    section: makeSection("gallery"),
  });

  assert.deepEqual(
    nextState.sections.map((section) => section.id),
    ["hero", "gallery", "story"],
  );
  assert.equal(nextState.selectedSectionId, "gallery");
});

test("moves a section up and down without losing relative order", () => {
  const state = createStudioCanvasState({
    sections: [makeSection("hero"), makeSection("story"), makeSection("proof")],
    selectedSectionId: "story",
  });

  const movedUp = reduce(state, {
    type: "move-section",
    sectionId: "story",
    direction: "up",
  });

  assert.deepEqual(
    movedUp.sections.map((section) => section.id),
    ["story", "hero", "proof"],
  );

  const movedDown = reduce(movedUp, {
    type: "move-section",
    sectionId: "story",
    direction: "down",
  });

  assert.deepEqual(
    movedDown.sections.map((section) => section.id),
    ["hero", "story", "proof"],
  );
});

test("reorders a section to an explicit index", () => {
  const state = createStudioCanvasState({
    sections: [makeSection("hero"), makeSection("story"), makeSection("proof")],
  });

  const nextState = reduce(state, {
    type: "reorder-section",
    sectionId: "proof",
    toIndex: 0,
  });

  assert.deepEqual(
    nextState.sections.map((section) => section.id),
    ["proof", "hero", "story"],
  );
});

test("duplicates a section with a derived identifier and keeps payload", () => {
  const state = createStudioCanvasState({
    sections: [makeSection("hero"), makeSection("story", { isHidden: true })],
    selectedSectionId: "story",
  });

  const nextState = reduce(state, {
    type: "duplicate-section",
    sectionId: "story",
  });

  assert.deepEqual(
    nextState.sections.map((section) => section.id),
    ["hero", "story", "story-copy-1"],
  );
  assert.equal(nextState.sections[2].label, "Section story (Copy)");
  assert.equal(nextState.sections[2].isHidden, true);
  assert.equal(nextState.selectedSectionId, "story-copy-1");
});

test("deletes a section and falls back selection to the nearest remaining section", () => {
  const state = createStudioCanvasState({
    sections: [makeSection("hero"), makeSection("story"), makeSection("proof")],
    selectedSectionId: "story",
  });

  const nextState = reduce(state, {
    type: "delete-section",
    sectionId: "story",
  });

  assert.deepEqual(
    nextState.sections.map((section) => section.id),
    ["hero", "proof"],
  );
  assert.equal(nextState.selectedSectionId, "proof");
});

test("toggles section visibility in place", () => {
  const state = createStudioCanvasState({
    sections: [makeSection("hero"), makeSection("story", { isHidden: false })],
  });

  const nextState = reduce(state, {
    type: "toggle-section-visibility",
    sectionId: "story",
  });

  assert.equal(nextState.sections[1].isHidden, true);

  const visibleAgain = reduce(nextState, {
    type: "toggle-section-visibility",
    sectionId: "story",
  });

  assert.equal(visibleAgain.sections[1].isHidden, false);
});
