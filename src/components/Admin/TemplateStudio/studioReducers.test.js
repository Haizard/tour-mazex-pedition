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

test("inserts multiple sections below the target section and selects the last one", () => {
  const state = createStudioCanvasState({
    sections: [makeSection("hero"), makeSection("story")],
    selectedSectionId: "story",
  });

  const nextState = reduce(state, {
    type: "insert-sections",
    targetSectionId: "hero",
    position: "below",
    sections: [makeSection("gallery"), makeSection("faq")],
  });

  assert.deepEqual(
    nextState.sections.map((section) => section.id),
    ["hero", "gallery", "faq", "story"],
  );
  assert.equal(nextState.selectedSectionId, "faq");
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

test("locked assigned sections cannot be structurally deleted or moved", () => {
  const state = createStudioCanvasState({
    sections: [
      makeSection("hero", {
        sourceMeta: {
          assignmentMeta: {
            structureLocked: true,
            contentEditable: true,
            styleEditable: true,
            bindingEditable: true,
          },
        },
      }),
      makeSection("story"),
    ],
    selectedSectionId: "hero",
  });

  const deleted = reduce(state, {
    type: "delete-section",
    sectionId: "hero",
  });
  const moved = reduce(state, {
    type: "move-section",
    sectionId: "hero",
    direction: "down",
  });

  assert.deepEqual(
    deleted.sections.map((section) => section.id),
    ["hero", "story"],
  );
  assert.deepEqual(
    moved.sections.map((section) => section.id),
    ["hero", "story"],
  );
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

test("updates section content and style fields without dropping prior data", () => {
  const state = createStudioCanvasState({
    sections: [
      makeSection("hero", {
        content: { title: "Old title" },
        styles: { accentColor: "#0f766e" },
      }),
    ],
  });

  const nextState = reduce(state, {
    type: "update-section",
    sectionId: "hero",
    patch: {
      label: "Updated Hero",
      content: { body: "New summary" },
      styles: { backgroundColor: "#f8fafc" },
      customCss: ".hero { padding: 72px; }",
    },
  });

  assert.equal(nextState.sections[0].label, "Updated Hero");
  assert.equal(nextState.sections[0].content.title, "Old title");
  assert.equal(nextState.sections[0].content.body, "New summary");
  assert.equal(nextState.sections[0].styles.accentColor, "#0f766e");
  assert.equal(nextState.sections[0].styles.backgroundColor, "#f8fafc");
  assert.equal(nextState.sections[0].customCss, ".hero { padding: 72px; }");
});

test("locked assigned sections still allow approved personalization fields", () => {
  const state = createStudioCanvasState({
    sections: [
      makeSection("hero", {
        label: "Assigned Hero",
        content: { title: "Old title" },
        styles: { accentColor: "#0f766e" },
        bindings: [{ sourceKey: "blogs" }],
        sourceMeta: {
          assignmentMeta: {
            structureLocked: true,
            contentEditable: true,
            styleEditable: true,
            bindingEditable: true,
          },
        },
      }),
    ],
  });

  const nextState = reduce(state, {
    type: "update-section",
    sectionId: "hero",
    patch: {
      label: "Assigned Hero Updated",
      content: { body: "New summary" },
      styles: { backgroundColor: "#f8fafc" },
      bindings: [{ sourceKey: "tourPackages" }],
    },
  });

  assert.equal(nextState.sections[0].label, "Assigned Hero Updated");
  assert.equal(nextState.sections[0].content.title, "Old title");
  assert.equal(nextState.sections[0].content.body, "New summary");
  assert.equal(nextState.sections[0].styles.backgroundColor, "#f8fafc");
  assert.equal(nextState.sections[0].bindings[0].sourceKey, "tourPackages");
});

test("updates responsive overrides without dropping earlier breakpoint settings", () => {
  const state = createStudioCanvasState({
    sections: [
      makeSection("hero", {
        responsive: {
          mobile: { columns: "1" },
          desktop: { columns: "3" },
        },
      }),
    ],
  });

  const nextState = reduce(state, {
    type: "update-section",
    sectionId: "hero",
    patch: {
      responsive: {
        tablet: { columns: "2", paddingY: "48px" },
      },
    },
  });

  assert.equal(nextState.sections[0].responsive.mobile.columns, "1");
  assert.equal(nextState.sections[0].responsive.desktop.columns, "3");
  assert.equal(nextState.sections[0].responsive.tablet.columns, "2");
  assert.equal(nextState.sections[0].responsive.tablet.paddingY, "48px");
});

test("replaces a section in place while keeping canvas ordering", () => {
  const state = createStudioCanvasState({
    sections: [makeSection("hero"), makeSection("story"), makeSection("proof")],
    selectedSectionId: "story",
  });

  const nextState = reduce(state, {
    type: "replace-section",
    sectionId: "story",
    section: makeSection("faq", {
      label: "FAQ Section",
      sourceType: "reusable",
    }),
  });

  assert.deepEqual(
    nextState.sections.map((section) => section.id),
    ["hero", "faq", "proof"],
  );
  assert.equal(nextState.sections[1].label, "FAQ Section");
  assert.equal(nextState.selectedSectionId, "faq");
});
