import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDemoDomain,
  calculateNextRenewalDate,
  normalizeAnnualDomainPrice,
  normalizeRequestedDomains,
  slugifyTenantValue,
} from "../utils/domainProvisioning.js";

test("slugifyTenantValue produces a stable tenant slug", () => {
  assert.equal(slugifyTenantValue("Safari & Sun Adventures"), "safari-and-sun-adventures");
});

test("buildDemoDomain composes the tenant subdomain with the platform demo root", () => {
  const originalDemoBaseUrl = process.env.PLATFORM_DEMO_BASE_URL;
  const originalSiteUrl = process.env.SITE_URL;
  const originalViteSiteUrl = process.env.VITE_SITE_URL;

  process.env.PLATFORM_DEMO_BASE_URL = "https://example.test";
  delete process.env.SITE_URL;
  delete process.env.VITE_SITE_URL;

  try {
    assert.equal(buildDemoDomain("serengeti-pro"), "https://example.test/demo/serengeti-pro");
  } finally {
    if (originalDemoBaseUrl === undefined) {
      delete process.env.PLATFORM_DEMO_BASE_URL;
    } else {
      process.env.PLATFORM_DEMO_BASE_URL = originalDemoBaseUrl;
    }

    if (originalSiteUrl === undefined) {
      delete process.env.SITE_URL;
    } else {
      process.env.SITE_URL = originalSiteUrl;
    }

    if (originalViteSiteUrl === undefined) {
      delete process.env.VITE_SITE_URL;
    } else {
      process.env.VITE_SITE_URL = originalViteSiteUrl;
    }
  }
});

test("normalizeRequestedDomains trims and lowercases domains", () => {
  assert.deepEqual(normalizeRequestedDomains([" Example.COM ", "", "WWW.TOURS.IO"]), [
    "example.com",
    "www.tours.io",
  ]);
});

test("normalizeAnnualDomainPrice keeps pricing inside the annual service band", () => {
  assert.equal(normalizeAnnualDomainPrice(20), 50);
  assert.equal(normalizeAnnualDomainPrice(120), 120);
  assert.equal(normalizeAnnualDomainPrice(250), 200);
});

test("calculateNextRenewalDate advances one year", () => {
  const currentDate = new Date("2026-04-22T00:00:00.000Z");
  assert.equal(calculateNextRenewalDate(currentDate).toISOString(), "2027-04-22T00:00:00.000Z");
});
