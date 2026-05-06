import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const componentSource = readFileSync(
  new URL("../../src/components/Admin/UnifiedInboxManager.jsx", import.meta.url),
  "utf8"
);

test("Unified Inbox renders the agent decision and recommended action surfaces", () => {
  assert.match(componentSource, /item\.agentDecision/);
  assert.match(componentSource, /Agent Brain/);
  assert.match(componentSource, /Recommended Actions/);
  assert.match(componentSource, /requiresHumanReview/);
  assert.match(componentSource, /leadTemperature/);
});
