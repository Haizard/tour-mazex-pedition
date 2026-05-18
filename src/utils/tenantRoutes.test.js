import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTenantScopedBlogCategoryPath,
  buildTenantScopedBlogPath,
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
  assert.equal(
    buildTenantScopedPath("/demo/mazepro/blogs", "/demo/mazepro/packages"),
    "/demo/mazepro/blogs",
  );
  assert.equal(
    buildTenantScopedPath("https://example.com", "/demo/mazepro/packages"),
    "https://example.com",
  );
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

test("buildTenantScopedBlogPath keeps tenant blog detail links inside the demo site", () => {
  assert.equal(
    buildTenantScopedBlogPath("youth-empowerment-project", "/demo/mazepro/blogs"),
    "/demo/mazepro/blogs/youth-empowerment-project",
  );
  assert.equal(
    buildTenantScopedBlogPath("youth-empowerment-project", "/blogs"),
    "/blogs/youth-empowerment-project",
  );
});

test("buildTenantScopedBlogCategoryPath keeps tenant blog category links inside the demo site", () => {
  assert.equal(
    buildTenantScopedBlogCategoryPath("safari", "/demo/mazepro/blogs"),
    "/demo/mazepro/blogs/category/safari",
  );
  assert.equal(
    buildTenantScopedBlogCategoryPath("safari", "/blogs"),
    "/blogs/category/safari",
  );
});
