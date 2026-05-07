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
