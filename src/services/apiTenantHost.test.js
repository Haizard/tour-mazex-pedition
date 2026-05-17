import test from "node:test";
import assert from "node:assert/strict";

import {
  getPlatformBootstrapFallback,
  isPlatformHostname,
  shouldUsePlatformBootstrapFallback,
} from "./api.js";

test("isPlatformHostname treats Vercel deployment hosts as platform hosts", () => {
  assert.equal(isPlatformHostname("tour-mazex-pedition-git-main-haizard.vercel.app"), true);
});

test("isPlatformHostname does not treat the legacy tenant Vercel host as platform", () => {
  assert.equal(isPlatformHostname("tourism-website-inky.vercel.app"), false);
});

test("shouldUsePlatformBootstrapFallback skips tenant bootstrap on platform pages", () => {
  assert.equal(
    shouldUsePlatformBootstrapFallback("mazexpeditions.vercel.app", "/platform"),
    true,
  );
});

test("shouldUsePlatformBootstrapFallback skips tenant bootstrap on platform root", () => {
  assert.equal(
    shouldUsePlatformBootstrapFallback("custom-platform-host.example", "/"),
    true,
  );
});

test("shouldUsePlatformBootstrapFallback skips tenant bootstrap on platform marketplace pages", () => {
  assert.equal(
    shouldUsePlatformBootstrapFallback("custom-platform-host.example", "/discover"),
    true,
  );
});

test("shouldUsePlatformBootstrapFallback keeps demo pages tenant-backed", () => {
  assert.equal(
    shouldUsePlatformBootstrapFallback("mazexpeditions.vercel.app", "/demo/mazexpeditions"),
    false,
  );
});

test("getPlatformBootstrapFallback returns platform bootstrap shape", () => {
  const fallback = getPlatformBootstrapFallback();

  assert.equal(fallback.isPlatform, true);
  assert.equal(fallback.tenant, null);
  assert.ok(fallback.theme);
  assert.ok(fallback.siteConfig);
});
