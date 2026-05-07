import test from "node:test";
import assert from "node:assert/strict";

import {
  applyManagedDnsProviderRecords,
  buildManagedDnsTargetRecords,
} from "../utils/dnsProviderAdapters.js";

test("buildManagedDnsTargetRecords converts apex and verification hosts to registrar-relative names", async () => {
  const records = await buildManagedDnsTargetRecords(
    {
      domain: "makoloafrika.co.tz",
      verificationHost: "_mazex.makoloafrika.co.tz",
      verificationValue: "maz-verify=abc123",
    },
    { PLATFORM_APEX_ADDRESSES: "1.1.1.1,2.2.2.2" },
    {},
  );

  assert.deepEqual(records, [
    {
      host: "_mazex",
      type: "TXT",
      value: "maz-verify=abc123",
      ttl: 1800,
    },
    {
      host: "@",
      type: "A",
      value: "1.1.1.1",
      ttl: 1800,
    },
    {
      host: "@",
      type: "A",
      value: "2.2.2.2",
      ttl: 1800,
    },
  ]);
});

test("buildManagedDnsTargetRecords uses subdomain labels for cname routing", async () => {
  const records = await buildManagedDnsTargetRecords(
    {
      domain: "www.makoloafrika.com",
      verificationHost: "_mazex.www.makoloafrika.com",
      verificationValue: "maz-verify=abc123",
    },
    { PLATFORM_DOMAIN_TARGET: "app.platform.test" },
    {},
  );

  assert.deepEqual(records, [
    {
      host: "_mazex.www",
      type: "TXT",
      value: "maz-verify=abc123",
      ttl: 1800,
    },
    {
      host: "www",
      type: "CNAME",
      value: "app.platform.test",
      ttl: 1800,
    },
  ]);
});

test("applyManagedDnsProviderRecords merges Namecheap hosts and submits the complete host list", async () => {
  const requests = [];
  const xmlHosts = `<?xml version="1.0" encoding="UTF-8"?>
    <ApiResponse Status="OK">
      <CommandResponse Type="namecheap.domains.dns.getHosts">
        <DomainDNSGetHostsResult Domain="makoloafrika.com" IsUsingOurDNS="true">
          <Host Name="mail" Type="CNAME" Address="ghs.googlehosted.com." MXPref="10" TTL="1800" />
          <Host Name="@" Type="A" Address="9.9.9.9" MXPref="10" TTL="1800" />
        </DomainDNSGetHostsResult>
      </CommandResponse>
    </ApiResponse>`;
  const xmlSetHosts = `<?xml version="1.0" encoding="UTF-8"?><ApiResponse Status="OK"></ApiResponse>`;

  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    return {
      ok: true,
      text: async () =>
        requests.length === 1
          ? xmlHosts
          : xmlSetHosts,
    };
  };

  const result = await applyManagedDnsProviderRecords(
    {
      domainProvider: { provider: "namecheap" },
    },
    {
      domain: "makoloafrika.com",
      verificationHost: "_mazex.makoloafrika.com",
      verificationValue: "maz-verify=abc123",
    },
    {
      NAMECHEAP_API_USER: "api-user",
      NAMECHEAP_API_KEY: "secret-key",
      NAMECHEAP_CLIENT_IP: "1.2.3.4",
      PLATFORM_APEX_ADDRESSES: "1.1.1.1",
    },
    fetchImpl,
    {},
  );

  assert.equal(result.provider, "namecheap");
  assert.equal(result.recordsApplied, 2);
  assert.equal(result.submittedRecordCount, 3);
  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /Command=namecheap\.domains\.dns\.getHosts/);
  assert.match(requests[1].url, /Command=namecheap\.domains\.dns\.setHosts/);
  assert.match(requests[1].url, /HostName1=mail/);
  assert.match(requests[1].url, /HostName2=_mazex/);
  assert.match(requests[1].url, /HostName3=%40/);
  assert.match(requests[1].url, /Address3=1\.1\.1\.1/);
});

test("applyManagedDnsProviderRecords updates GoDaddy TXT and routing records separately", async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    return {
      ok: true,
      text: async () => "",
      json: async () => ({}),
    };
  };

  const result = await applyManagedDnsProviderRecords(
    {
      domainProvider: { provider: "godaddy" },
    },
    {
      domain: "www.makoloafrika.com",
      verificationHost: "_mazex.www.makoloafrika.com",
      verificationValue: "maz-verify=abc123",
    },
    {
      GODADDY_API_KEY: "gd-key",
      GODADDY_API_SECRET: "gd-secret",
      PLATFORM_DOMAIN_TARGET: "app.platform.test",
    },
    fetchImpl,
    {},
  );

  assert.equal(result.provider, "godaddy");
  assert.equal(result.recordsApplied, 2);
  assert.equal(result.submittedRecordCount, 2);
  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /\/v1\/domains\/makoloafrika\.com\/records\/TXT\/_mazex\.www$/);
  assert.match(requests[1].url, /\/v1\/domains\/makoloafrika\.com\/records\/CNAME\/www$/);
  assert.equal(
    requests[0].options.headers.Authorization,
    "sso-key gd-key:gd-secret",
  );
  assert.deepEqual(JSON.parse(requests[1].options.body), [
    { data: "app.platform.test", ttl: 1800 },
  ]);
});

test("applyManagedDnsProviderRecords rejects manual mode", async () => {
  await assert.rejects(
    () =>
      applyManagedDnsProviderRecords(
        { domainProvider: { provider: "manual" } },
        {
          domain: "makoloafrika.com",
          verificationHost: "_mazex.makoloafrika.com",
          verificationValue: "maz-verify=abc123",
        },
        {},
        async () => ({ ok: true }),
        {},
      ),
    /does not support automatic dns writes/i,
  );
});
