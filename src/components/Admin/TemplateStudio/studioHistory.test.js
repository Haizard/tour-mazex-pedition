import test from "node:test";
import assert from "node:assert/strict";

import {
  createStudioHistoryState,
  pushStudioHistory,
  undoStudioHistory,
  redoStudioHistory,
} from "./studioHistory.js";

const baseState = {
  sections: [{ id: "hero" }, { id: "story" }],
  selectedSectionId: "story",
};
const nextState = {
  sections: [{ id: "story" }, { id: "hero" }],
  selectedSectionId: "story",
};

test("pushStudioHistory stores the previous canvas state and clears redo", () => {
  const history = pushStudioHistory(createStudioHistoryState(baseState), nextState);

  assert.equal(history.past.length, 1);
  assert.deepEqual(history.present, nextState);
  assert.deepEqual(history.future, []);
});

test("undoStudioHistory walks back to the previous canvas snapshot", () => {
  const history = pushStudioHistory(createStudioHistoryState(baseState), nextState);
  const undone = undoStudioHistory(history);

  assert.deepEqual(undone.present, baseState);
  assert.equal(undone.future.length, 1);
});

test("redoStudioHistory restores the most recently undone snapshot", () => {
  const history = pushStudioHistory(createStudioHistoryState(baseState), nextState);
  const redone = redoStudioHistory(undoStudioHistory(history));

  assert.deepEqual(redone.present, nextState);
  assert.equal(redone.past.length, 1);
});
