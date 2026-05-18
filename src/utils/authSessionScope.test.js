import test from "node:test";
import assert from "node:assert/strict";
import {
  shouldRefreshAdminSessionOnPath,
  shouldRefreshPlatformAdminSessionOnPath,
} from "./authSessionScope.js";

test("admin session refresh only runs on tenant admin routes", () => {
  assert.equal(shouldRefreshAdminSessionOnPath("/admin"), true);
  assert.equal(shouldRefreshAdminSessionOnPath("/admin/login"), true);
  assert.equal(shouldRefreshAdminSessionOnPath("/demo/mazepro/blogs"), false);
  assert.equal(shouldRefreshAdminSessionOnPath("/discover"), false);
});

test("platform admin session refresh only runs on platform admin routes", () => {
  assert.equal(shouldRefreshPlatformAdminSessionOnPath("/platform"), true);
  assert.equal(shouldRefreshPlatformAdminSessionOnPath("/platform/login"), true);
  assert.equal(shouldRefreshPlatformAdminSessionOnPath("/super-admin"), true);
  assert.equal(shouldRefreshPlatformAdminSessionOnPath("/demo/mazepro"), false);
});
