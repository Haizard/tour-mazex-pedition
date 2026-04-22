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
  assert.equal(buildDemoDomain("serengeti-pro"), "serengeti-pro.demo.mazex.co.tz");
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
