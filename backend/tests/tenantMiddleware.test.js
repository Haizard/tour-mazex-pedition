import test from "node:test";
import assert from "node:assert/strict";

import {
  shouldBypassTenantMiddleware,
  shouldResolveMissingTenantAsPlatform,
} from "../middleware/tenantMiddleware.js";

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

test("shouldResolveMissingTenantAsPlatform allows platform-origin read requests", () => {
  assert.equal(
    shouldResolveMissingTenantAsPlatform(
      {
        method: "GET",
        headers: { origin: "https://mazexpeditions.vercel.app" },
      },
      { hostname: "internal.proxy.local" },
    ),
    true,
  );
});

test("shouldResolveMissingTenantAsPlatform allows platform referer read requests", () => {
  assert.equal(
    shouldResolveMissingTenantAsPlatform(
      {
        method: "GET",
        headers: { referer: "https://mazexpeditions.vercel.app/templates" },
      },
      { hostname: "internal.proxy.local" },
    ),
    true,
  );
});

test("shouldResolveMissingTenantAsPlatform does not mask write requests", () => {
  assert.equal(
    shouldResolveMissingTenantAsPlatform(
      {
        method: "POST",
        headers: { origin: "https://mazexpeditions.vercel.app" },
      },
      { hostname: "internal.proxy.local" },
    ),
    false,
  );
});

test("shouldResolveMissingTenantAsPlatform does not mask custom tenant domains", () => {
  assert.equal(
    shouldResolveMissingTenantAsPlatform(
      {
        method: "GET",
        headers: { host: "missingtenant.com" },
      },
      { hostname: "missingtenant.com" },
    ),
    false,
  );
});

test("shouldResolveMissingTenantAsPlatform keeps demo requests tenant-backed", () => {
  assert.equal(
    shouldResolveMissingTenantAsPlatform(
      {
        method: "GET",
        headers: {
          origin: "https://mazexpeditions.vercel.app",
          "x-tenant-source": "demo",
        },
      },
      { hostname: "internal.proxy.local" },
    ),
    false,
  );
});
