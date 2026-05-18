import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyStudioBinding,
  normalizeStudioBindings,
} from "./bindingUtils.js";

test("createEmptyStudioBinding seeds a manual binding for editor workflows", () => {
  const binding = createEmptyStudioBinding();

  assert.equal(binding.sourceKey, "");
  assert.equal(binding.bindingType, "static");
  assert.equal(binding.fieldPath, "");
  assert.equal(binding.confidence, 0);
});

test("normalizeStudioBindings keeps valid bindings and fills missing defaults", () => {
  const bindings = normalizeStudioBindings([
    { sourceKey: "blogs", fieldPath: "items", bindingType: "dynamic-collection" },
    { sourceKey: "testimonials" },
  ]);

  assert.equal(bindings.length, 2);
  assert.equal(bindings[0].bindingType, "dynamic-collection");
  assert.equal(bindings[1].bindingType, "static");
  assert.equal(bindings[1].fieldPath, "");
});
