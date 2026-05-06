import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const routeSource = readFileSync(
  new URL("../routes/unifiedInboxRoutes.js", import.meta.url),
  "utf8"
);

const apiSource = readFileSync(
  new URL("../../src/services/api.js", import.meta.url),
  "utf8"
);

const uiSource = readFileSync(
  new URL("../../src/components/Admin/UnifiedInboxManager.jsx", import.meta.url),
  "utf8"
);

test("Unified Inbox exposes an agent action logging endpoint and client hook", () => {
  assert.match(routeSource, /AgentDecisionLog/);
  assert.match(routeSource, /router\.post\("\/agent-actions"/);
  assert.match(routeSource, /buildAgentRecommendedActionRecord/);
  assert.match(apiSource, /recordUnifiedInboxAgentAction/);
  assert.match(uiSource, /handleRecordAgentAction/);
  assert.match(uiSource, /Log Complete/);
});
