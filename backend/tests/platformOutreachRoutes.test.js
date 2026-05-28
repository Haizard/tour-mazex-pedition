import test from "node:test";
import assert from "node:assert/strict";

test("platform outreach routes import cleanly", async () => {
  const module = await import("../routes/platformOutreachRoutes.js");
  assert.equal(typeof module.default, "function");
});
