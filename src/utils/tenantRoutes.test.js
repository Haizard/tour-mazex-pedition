import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTenantScopedPath,
  buildTenantScopedTourPath,
  getTenantBasePath,
} from "./tenantRoutes.js";

test("getTenantBasePath returns the active demo tenant prefix", () => {
  assert.equal(getTenantBasePath("/demo/mazepro/packages/umbwe-route"), "/demo/mazepro");
  assert.equal(getTenantBasePath("/packages/umbwe-route"), "");
});

test("buildTenantScopedPath keeps demo tenant routes scoped", () => {
  assert.equal(
    buildTenantScopedPath("/packages", "/demo/mazepro"),
    "/demo/mazepro/packages",
  );
  assert.equal(buildTenantScopedPath("/packages", "/packages"), "/packages");
  assert.equal(buildTenantScopedPath("/", "/demo/mazepro/packages"), "/demo/mazepro");
});

test("buildTenantScopedTourPath includes the tenant prefix and tour id", () => {
  assert.equal(
    buildTenantScopedTourPath(
      { _id: "69cbc45d4b9aa4c7fe679549", title: "Umbwe Route Mount Kilimanjaro" },
      "/demo/mazepro",
    ),
    "/demo/mazepro/packages/umbwe-route-mount-kilimanjaro?tourId=69cbc45d4b9aa4c7fe679549",
  );
});
