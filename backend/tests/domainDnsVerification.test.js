import test from "node:test";
import assert from "node:assert/strict";

import {
  buildExpectedRoutingProfile,
  verifyCustomDomainRecord,
} from "../utils/domainDnsVerifier.js";

test("buildExpectedRoutingProfile returns CNAME routing for subdomains", async () => {
  const profile = await buildExpectedRoutingProfile("www.makoloafrika.com", {
    PLATFORM_DOMAIN_TARGET: "app.platform.test",
  });

  assert.equal(profile.type, "CNAME");
  assert.equal(profile.targetHost, "app.platform.test");
  assert.equal(profile.targetSummary, "app.platform.test");
});

test("buildExpectedRoutingProfile returns A routing for apex domains", async () => {
  const profile = await buildExpectedRoutingProfile(
    "makoloafrika.com",
    { PLATFORM_APEX_ADDRESSES: "1.1.1.1, 2.2.2.2" },
    {},
  );

  assert.equal(profile.type, "A");
  assert.deepEqual(profile.targetValue, ["1.1.1.1", "2.2.2.2"]);
});

test("buildExpectedRoutingProfile treats .co.tz root domains as apex domains", async () => {
  const profile = await buildExpectedRoutingProfile(
    "makoloafrika.co.tz",
    { PLATFORM_APEX_ADDRESSES: "1.1.1.1" },
    {},
  );

  assert.equal(profile.type, "A");
});

test("verifyCustomDomainRecord marks a subdomain as verified when TXT and CNAME match", async () => {
  const verification = await verifyCustomDomainRecord(
    {
      domain: "www.makoloafrika.com",
      verificationHost: "_mazex.www.makoloafrika.com",
      verificationValue: "maz-verify=abc123",
    },
    { PLATFORM_DOMAIN_TARGET: "app.platform.test" },
    {
      resolveTxt: async () => [["maz-verify=abc123"]],
      resolveCname: async () => ["app.platform.test"],
      resolve4: async () => [],
    },
  );

  assert.equal(verification.verified, true);
  assert.equal(verification.status, "verified");
  assert.equal(verification.routingType, "CNAME");
});

test("verifyCustomDomainRecord explains missing DNS requirements", async () => {
  const verification = await verifyCustomDomainRecord(
    {
      domain: "makoloafrika.com",
      verificationHost: "_mazex.makoloafrika.com",
      verificationValue: "maz-verify=xyz789",
    },
    { PLATFORM_APEX_ADDRESSES: "3.3.3.3" },
    {
      resolveTxt: async () => [["wrong-value"]],
      resolveCname: async () => [],
      resolve4: async () => ["4.4.4.4"],
    },
  );

  assert.equal(verification.verified, false);
  assert.equal(verification.status, "error");
  assert.match(verification.errorMessage, /TXT verification record is missing/i);
  assert.match(verification.errorMessage, /Apex routing is not pointing/i);
});
