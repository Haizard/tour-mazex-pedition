import test from "node:test";
import assert from "node:assert/strict";

import { buildSiteSettingsUpsert } from "../controllers/siteSettingsController.js";

test("buildSiteSettingsUpsert keeps tenantId only in $setOnInsert", () => {
  const update = buildSiteSettingsUpsert(
    { tenantId: "tenant-123" },
    { facebook: "https://facebook.com/demo" }
  );

  assert.equal(update.$set.tenantId, undefined);
  assert.equal(update.$set.facebook, "https://facebook.com/demo");
  assert.equal(update.$setOnInsert.tenantId, "tenant-123");
  assert.equal(update.$setOnInsert.facebook, undefined);
});
