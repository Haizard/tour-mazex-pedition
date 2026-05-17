import test from "node:test";
import assert from "node:assert/strict";

import {
  isDemoAccessAllowed,
  resolveTenantLookup,
} from "../utils/tenantContext.js";

test("resolveTenantLookup treats mazexpeditions.vercel.app as platform host", () => {
  const lookup = resolveTenantLookup({
    headers: {
      host: "mazexpeditions.vercel.app",
    },
    query: {},
  });

  assert.equal(lookup.isPlatform, true);
  assert.equal(lookup.hostname, "mazexpeditions.vercel.app");
});

test("resolveTenantLookup maps legacy demo aliases back to the legacy tenant slug", () => {
  const lookup = resolveTenantLookup({
    headers: {
      "x-tenant-slug": "mazexpedtion",
      host: "mazexpeditions.vercel.app",
    },
    query: {},
  });

  assert.equal(lookup.slug, "maz-expeditions");
  assert.equal(lookup.hostname, "mazexpeditions.vercel.app");
});

test("resolveTenantLookup only allows legacy fallback for default hosts", () => {
  assert.equal(
    resolveTenantLookup({
      headers: { host: "mazexpeditions.com" },
      query: {},
    }).allowLegacyFallback,
    true,
  );

  assert.equal(
    resolveTenantLookup({
      headers: {
        host: "mazexpeditions.vercel.app",
        "x-tenant-slug": "new-tenant",
      },
      query: {},
    }).allowLegacyFallback,
    false,
  );

  assert.equal(
    resolveTenantLookup({
      headers: { host: "new-tenant.mazexpeditions.vercel.app" },
      query: {},
    }).allowLegacyFallback,
    false,
  );

  assert.equal(
    resolveTenantLookup({
      headers: { host: "newtenant.com" },
      query: {},
    }).allowLegacyFallback,
    false,
  );
});

test("isDemoAccessAllowed blocks demo API requests when the tenant has disabled demo access", () => {
  assert.equal(
    isDemoAccessAllowed(
      { demoAccessEnabled: false },
      { headers: { "x-tenant-source": "demo" } },
    ),
    false,
  );
  assert.equal(
    isDemoAccessAllowed(
      { demoAccessEnabled: false },
      { headers: { host: "makoloafrika.com" } },
    ),
    true,
  );
});
