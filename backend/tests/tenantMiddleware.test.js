import test from "node:test";
import assert from "node:assert/strict";

import {
  shouldBypassTenantMiddleware,
  shouldResolveMissingTenantAsPlatform,
  tenantMiddleware,
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

test("shouldBypassTenantMiddleware skips traveler authentication routes", () => {
  assert.equal(
    shouldBypassTenantMiddleware({ originalUrl: "/api/traveler-auth/google/callback" }),
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

test("tenantMiddleware resolves demo tenant requests by subdomain when slug lookup misses", async () => {
  const findOneCalls = [];
  const demoSlug = "demopro";

  const TenantModule = await import("../models/Tenant.js");
  const originalTenantFindOne = TenantModule.default.findOne;
  TenantModule.default.findOne = (query) => {
    findOneCalls.push(query);
    if (query.slug === demoSlug) {
      return { lean: async () => null };
    }

    if (query.subdomain === demoSlug) {
      return { lean: async () => ({ _id: "tenant1", slug: "demo-pro", subdomain: demoSlug }) };
    }

    return { lean: async () => null };
  };

  const req = {
    method: "GET",
    originalUrl: "/api/tours",
    headers: {
      host: "mazexpeditions.vercel.app",
      "x-tenant-slug": demoSlug,
      "x-tenant-source": "demo",
    },
    query: {},
  };

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  let nextCalled = false;
  await tenantMiddleware(req, res, () => {
    nextCalled = true;
  });

  TenantModule.default.findOne = originalTenantFindOne;

  assert.equal(nextCalled, true);
  assert.equal(req.tenant?.subdomain, demoSlug);
  assert.deepEqual(findOneCalls[0], { slug: demoSlug, status: "active" });
  assert.deepEqual(findOneCalls[1], { subdomain: demoSlug, status: "active" });
});

test("tenantMiddleware resolves demo tenant requests by stored demoDomain when slug and subdomain changed", async () => {
  const findOneCalls = [];
  const demoSlug = "demopro";

  const TenantModule = await import("../models/Tenant.js");
  const originalTenantFindOne = TenantModule.default.findOne;
  TenantModule.default.findOne = (query) => {
    findOneCalls.push(query);
    if (query.slug === demoSlug) {
      return { lean: async () => null };
    }

    if (query.subdomain === demoSlug) {
      return { lean: async () => null };
    }

    if (query.demoDomain === `https://mazexpeditions.vercel.app/demo/${demoSlug}`) {
      return {
        lean: async () => ({
          _id: "tenant2",
          slug: "demo-pro",
          subdomain: "demo-pro-live",
          demoDomain: `https://mazexpeditions.vercel.app/demo/${demoSlug}`,
        }),
      };
    }

    return { lean: async () => null };
  };

  const req = {
    method: "GET",
    originalUrl: "/api/tours",
    headers: {
      host: "mazexpeditions.vercel.app",
      "x-tenant-slug": demoSlug,
      "x-tenant-source": "demo",
    },
    query: {},
  };

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  let nextCalled = false;
  await tenantMiddleware(req, res, () => {
    nextCalled = true;
  });

  TenantModule.default.findOne = originalTenantFindOne;

  assert.equal(nextCalled, true);
  assert.equal(req.tenant?.demoDomain, `https://mazexpeditions.vercel.app/demo/${demoSlug}`);
  assert.deepEqual(findOneCalls[0], { slug: demoSlug, status: "active" });
  assert.deepEqual(findOneCalls[1], { subdomain: demoSlug, status: "active" });
  assert.deepEqual(findOneCalls[2], {
    demoDomain: `https://mazexpeditions.vercel.app/demo/${demoSlug}`,
    status: "active",
  });
});
