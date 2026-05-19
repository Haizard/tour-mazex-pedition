import test from "node:test";
import assert from "node:assert/strict";

import { STYLE_PRESETS, findStylePreset } from "./stylePresets.js";

test("style presets expose reusable preset definitions", () => {
  assert.ok(STYLE_PRESETS.length >= 3);
  assert.equal(findStylePreset("editorial")?.styles.backgroundColor, "#fffaf5");
  assert.equal(findStylePreset("missing"), null);
});
