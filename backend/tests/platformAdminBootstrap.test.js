import test from "node:test";
import assert from "node:assert/strict";

import {
  getConfiguredPlatformAdminPassword,
  getConfiguredPlatformAdminUsername,
  shouldRecoverPlatformAdminWithEnv,
} from "../utils/platformAdminBootstrap.js";

test("getConfiguredPlatformAdminUsername falls back to platform-admin", () => {
  assert.equal(getConfiguredPlatformAdminUsername({}), "platform-admin");
  assert.equal(
    getConfiguredPlatformAdminUsername({ PLATFORM_ADMIN_USERNAME: " SuperAdmin " }),
    "superadmin"
  );
});

test("getConfiguredPlatformAdminPassword uses platform env before shared admin password", () => {
  assert.equal(
    getConfiguredPlatformAdminPassword({
      PLATFORM_ADMIN_PASSWORD: "platform-secret",
      ADMIN_PASSWORD: "tenant-secret",
    }),
    "platform-secret"
  );
  assert.equal(
    getConfiguredPlatformAdminPassword({
      ADMIN_PASSWORD: "tenant-secret",
    }),
    "tenant-secret"
  );
});

test("shouldRecoverPlatformAdminWithEnv only matches configured platform credentials", () => {
  const env = {
    PLATFORM_ADMIN_USERNAME: "ops-admin",
    PLATFORM_ADMIN_PASSWORD: "correct-horse",
  };

  assert.equal(
    shouldRecoverPlatformAdminWithEnv({
      username: "ops-admin",
      password: "correct-horse",
      env,
    }),
    true
  );
  assert.equal(
    shouldRecoverPlatformAdminWithEnv({
      username: "platform-admin",
      password: "correct-horse",
      env,
    }),
    false
  );
  assert.equal(
    shouldRecoverPlatformAdminWithEnv({
      username: "ops-admin",
      password: "wrong",
      env,
    }),
    false
  );
});
