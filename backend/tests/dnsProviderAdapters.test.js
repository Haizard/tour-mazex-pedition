import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDomainSetupPlan,
  getDomainProviderCapabilities,
} from "../utils/dnsProviderAdapters.js";

test("manual provider setup plan returns DNS records and manual instructions", async () => {
  const plan = await buildDomainSetupPlan(
    {
      domainProvider: { provider: "manual", autoManageDns: false },
    },
    {
      domain: "makoloafrika.com",
      verificationHost: "_mazex.makoloafrika.com",
      verificationValue: "maz-verify=abc123",
    },
    { PLATFORM_APEX_ADDRESSES: "1.1.1.1" },
    {},
  );

  assert.equal(plan.provider, "manual");
  assert.equal(plan.autoManageDns, false);
  assert.equal(plan.records.length, 2);
  assert.match(plan.instructions, /add the required txt and routing records/i);
});

test("cloudflare capabilities report automatic DNS support", () => {
  const capabilities = getDomainProviderCapabilities({
    domainProvider: { provider: "cloudflare" },
  });

  assert.equal(capabilities.provider, "cloudflare");
  assert.equal(capabilities.supportsAutomaticDnsWrites, true);
  assert.equal(capabilities.requiresZoneId, true);
});

test("namecheap setup plan explains account eligibility and manual fallback", async () => {
  const plan = await buildDomainSetupPlan(
    {
      domainProvider: { provider: "namecheap", autoManageDns: true },
    },
    {
      domain: "makoloafrika.com",
      verificationHost: "_mazex.makoloafrika.com",
      verificationValue: "maz-verify=abc123",
    },
    { PLATFORM_APEX_ADDRESSES: "1.1.1.1" },
    {},
  );

  assert.equal(plan.provider, "namecheap");
  assert.equal(plan.autoManageDns, true);
  assert.match(plan.instructions, /namecheap/i);
  assert.match(plan.instructions, /manual dns fallback/i);
  assert.equal(plan.records.length, 2);
});

test("namecheap capabilities report api and server ip requirements", () => {
  const capabilities = getDomainProviderCapabilities({
    domainProvider: { provider: "namecheap" },
  });

  assert.equal(capabilities.provider, "namecheap");
  assert.equal(capabilities.supportsAutomaticDnsWrites, true);
  assert.equal(capabilities.requiresZoneId, false);
  assert.equal(capabilities.requiresExternalCredential, true);
  assert.equal(capabilities.requiresWhitelistedServerIp, true);
});

test("godaddy setup plan explains api-key automation with manual fallback", async () => {
  const plan = await buildDomainSetupPlan(
    {
      domainProvider: { provider: "godaddy", autoManageDns: true },
    },
    {
      domain: "makoloafrika.com",
      verificationHost: "_mazex.makoloafrika.com",
      verificationValue: "maz-verify=abc123",
    },
    { PLATFORM_APEX_ADDRESSES: "1.1.1.1" },
    {},
  );

  assert.equal(plan.provider, "godaddy");
  assert.equal(plan.autoManageDns, true);
  assert.match(plan.instructions, /godaddy/i);
  assert.match(plan.instructions, /manual dns fallback/i);
  assert.equal(plan.records.length, 2);
});

test("godaddy capabilities report api credential requirements", () => {
  const capabilities = getDomainProviderCapabilities({
    domainProvider: { provider: "godaddy" },
  });

  assert.equal(capabilities.provider, "godaddy");
  assert.equal(capabilities.supportsAutomaticDnsWrites, true);
  assert.equal(capabilities.requiresZoneId, false);
  assert.equal(capabilities.requiresExternalCredential, true);
  assert.equal(capabilities.requiresApiSecret, true);
});
