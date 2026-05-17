import test from "node:test";
import assert from "node:assert/strict";

import { shouldBypassTenantMiddleware } from "../middleware/tenantMiddleware.js";

test("shouldBypassTenantMiddleware skips platform authentication routes", () => {
  assert.equal(
    shouldBypassTenantMiddleware({ originalUrl: "/api/platform-auth/me" }),
    true,
  );
});

test("shouldBypassTenantMiddleware skips platform admin routes", () => {
  assert.equal(
    shouldBypassTenantMiddleware({ originalUrl: "/api/platform-admin/summary" }),
    true,
  );
});

test("shouldBypassTenantMiddleware keeps tenant bootstrap tenant-aware", () => {
  assert.equal(
    shouldBypassTenantMiddleware({ originalUrl: "/api/tenant/bootstrap" }),
    false,
  );
});
