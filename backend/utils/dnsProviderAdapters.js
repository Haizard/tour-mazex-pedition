import { buildExpectedRoutingProfile } from "./domainDnsVerifier.js";

const SUPPORTED_PROVIDERS = new Set([
  "manual",
  "cloudflare",
  "namecheap",
  "godaddy",
]);

const normalizeProvider = (value = "") => {
  const normalized = value.toString().trim().toLowerCase() || "manual";
  return SUPPORTED_PROVIDERS.has(normalized) ? normalized : "manual";
};

const buildProviderInstructions = (provider, autoManageDns) => {
  if (provider === "cloudflare") {
    return autoManageDns
      ? "Cloudflare is configured for automatic DNS management once valid API credentials are present."
      : "Use Cloudflare DNS to add the required TXT and routing records manually, or enable automatic DNS management.";
  }

  if (provider === "namecheap") {
    return autoManageDns
      ? "Namecheap auto-DNS can be used once API access is enabled on your Namecheap account and this server IPv4 address is whitelisted. Until then, use the records below as the manual DNS fallback."
      : "Use Namecheap BasicDNS host records to add the required TXT and routing records manually. Automatic Namecheap DNS can be enabled later after API access and server IP whitelisting are ready.";
  }

  if (provider === "godaddy") {
    return autoManageDns
      ? "GoDaddy auto-DNS can be used once valid production API credentials are connected for the GoDaddy account that owns the domain. Until then, use the records below as the manual DNS fallback."
      : "Use GoDaddy DNS management to add the required TXT and routing records manually. Automatic GoDaddy DNS can be enabled later after production API credentials are connected.";
  }

  return "Add the required TXT and routing records at your DNS provider, then run DNS verification from the platform.";
};

const buildTxtRecord = (record = {}) => ({
  type: "TXT",
  host: record.verificationHost || "",
  value: record.verificationValue || "",
  purpose: "Domain ownership verification",
});

const MULTI_PART_PUBLIC_SUFFIXES = new Set([
  "co.tz",
  "or.tz",
  "ac.tz",
  "co.ke",
  "or.ke",
  "ac.ke",
  "co.ug",
  "co.uk",
  "org.uk",
  "com.au",
  "co.za",
]);

const normalizeDomain = (value = "") =>
  value.toString().trim().toLowerCase().replace(/\.$/, "");

const getRegistrableDomain = (domain = "") => {
  const normalized = normalizeDomain(domain);
  const parts = normalized.split(".");

  if (parts.length <= 2) {
    return normalized;
  }

  const publicSuffix = parts.slice(-2).join(".");
  const registrableLength = MULTI_PART_PUBLIC_SUFFIXES.has(publicSuffix) ? 3 : 2;
  return parts.slice(-registrableLength).join(".");
};

const toRelativeHost = (fqdn = "", registrableDomain = "") => {
  const normalizedHost = normalizeDomain(fqdn);
  const normalizedRoot = normalizeDomain(registrableDomain);

  if (!normalizedHost || !normalizedRoot) {
    return normalizedHost;
  }

  if (normalizedHost === normalizedRoot) {
    return "@";
  }

  const suffix = `.${normalizedRoot}`;
  if (normalizedHost.endsWith(suffix)) {
    return normalizedHost.slice(0, -suffix.length) || "@";
  }

  return normalizedHost;
};

const buildManagedDnsRecord = (host, type, value, ttl = 1800) => ({
  host,
  type,
  value,
  ttl,
});

const buildRoutingRecord = async (record = {}, env = process.env, resolver) => {
  const routing = await buildExpectedRoutingProfile(record.domain, env, resolver);

  if (routing.type === "CNAME") {
    return {
      type: "CNAME",
      host: record.domain || "",
      value: routing.targetHost,
      purpose: "Route live traffic to the platform",
    };
  }

  return {
    type: "A",
    host: record.domain || "",
    value: Array.isArray(routing.targetValue) ? routing.targetValue.join(", ") : "",
    purpose: "Route apex traffic to the platform",
  };
};

export const buildDomainSetupPlan = async (
  tenant = {},
  record = {},
  env = process.env,
  resolver,
) => {
  const routingRecord = await buildRoutingRecord(record, env, resolver);
  const provider = normalizeProvider(tenant.domainProvider?.provider);
  const autoManageDns =
    provider !== "manual" && tenant.domainProvider?.autoManageDns === true;

  return {
    provider,
    autoManageDns,
    nameserverMode: tenant.domainProvider?.nameserverMode || "external",
    zoneId: tenant.domainProvider?.zoneId || "",
    records: [buildTxtRecord(record), routingRecord],
    instructions: buildProviderInstructions(provider, autoManageDns),
  };
};

export const buildManagedDnsTargetRecords = async (
  record = {},
  env = process.env,
  resolver,
) => {
  const domain = normalizeDomain(record.domain || "");
  const registrableDomain = getRegistrableDomain(domain);
  const routing = await buildExpectedRoutingProfile(domain, env, resolver);
  const desiredRecords = [
    buildManagedDnsRecord(
      toRelativeHost(record.verificationHost || "", registrableDomain),
      "TXT",
      String(record.verificationValue || "").trim(),
    ),
  ];

  if (routing.type === "CNAME") {
    desiredRecords.push(
      buildManagedDnsRecord(
        toRelativeHost(domain, registrableDomain),
        "CNAME",
        routing.targetHost,
      ),
    );
    return desiredRecords;
  }

  for (const address of routing.targetValue || []) {
    desiredRecords.push(buildManagedDnsRecord("@", "A", address));
  }

  return desiredRecords;
};

const parseNamecheapHosts = (xml = "") => {
  const hostMatches = xml.match(/<Host\b[^>]*\/>/gi) || [];
  return hostMatches.map((rawHost) => {
    const readAttribute = (attribute) => {
      const match = rawHost.match(new RegExp(`${attribute}="([^"]*)"`, "i"));
      return match ? match[1] : "";
    };

    return {
      host: readAttribute("Name") || "@",
      type: (readAttribute("Type") || "").toUpperCase(),
      value: readAttribute("Address") || "",
      ttl: Number(readAttribute("TTL") || 1800),
      mxPref: Number(readAttribute("MXPref") || 10),
    };
  });
};

const assertNamecheapSuccess = (xml = "", commandName = "Namecheap") => {
  if (!/Status="OK"/i.test(xml)) {
    const errorMatch = xml.match(/<Error[^>]*>([^<]+)<\/Error>/i);
    throw new Error(
      errorMatch?.[1] || `${commandName} request failed. Check API access and DNS mode.`,
    );
  }
};

const buildNamecheapUrl = (env = process.env, params = {}) => {
  const baseUrl = env.NAMECHEAP_API_BASE_URL || "https://api.namecheap.com/xml.response";
  const search = new URLSearchParams({
    ApiUser: env.NAMECHEAP_API_USER || "",
    ApiKey: env.NAMECHEAP_API_KEY || "",
    UserName: env.NAMECHEAP_API_USER || "",
    ClientIp: env.NAMECHEAP_CLIENT_IP || "",
    ...params,
  });
  return `${baseUrl}?${search.toString()}`;
};

const applyNamecheapManagedDns = async (
  record,
  env,
  fetchImpl,
  resolver,
) => {
  if (!env.NAMECHEAP_API_USER || !env.NAMECHEAP_API_KEY || !env.NAMECHEAP_CLIENT_IP) {
    throw new Error(
      "Namecheap automation needs NAMECHEAP_API_USER, NAMECHEAP_API_KEY, and NAMECHEAP_CLIENT_IP.",
    );
  }

  const registrableDomain = getRegistrableDomain(record.domain || "");
  const [sld, ...tldParts] = registrableDomain.split(".");
  const tld = tldParts.join(".");
  const desiredRecords = await buildManagedDnsTargetRecords(record, env, resolver);

  const getHostsResponse = await fetchImpl(
    buildNamecheapUrl(env, {
      Command: "namecheap.domains.dns.getHosts",
      SLD: sld,
      TLD: tld,
    }),
  );
  const getHostsXml = await getHostsResponse.text();
  assertNamecheapSuccess(getHostsXml, "Namecheap getHosts");

  const existingRecords = parseNamecheapHosts(getHostsXml);
  const desiredKeys = new Set(desiredRecords.map((item) => `${item.type}:${item.host}`));
  const mergedRecords = [
    ...existingRecords.filter((item) => !desiredKeys.has(`${item.type}:${item.host}`)),
    ...desiredRecords,
  ];

  const setParams = {
    Command: "namecheap.domains.dns.setHosts",
    SLD: sld,
    TLD: tld,
  };

  mergedRecords.forEach((item, index) => {
    const suffix = index + 1;
    setParams[`HostName${suffix}`] = item.host;
    setParams[`RecordType${suffix}`] = item.type;
    setParams[`Address${suffix}`] = item.value;
    setParams[`TTL${suffix}`] = String(item.ttl || 1800);
    if (item.type === "MX") {
      setParams[`MXPref${suffix}`] = String(item.mxPref || 10);
    }
  });

  const setHostsResponse = await fetchImpl(buildNamecheapUrl(env, setParams), {
    method: "POST",
  });
  const setHostsXml = await setHostsResponse.text();
  assertNamecheapSuccess(setHostsXml, "Namecheap setHosts");

  return {
    provider: "namecheap",
    recordsApplied: desiredRecords.length,
    submittedRecordCount: mergedRecords.length,
    recordNames: desiredRecords.map((item) => `${item.type} ${item.host}`),
  };
};

const applyGodaddyManagedDns = async (record, env, fetchImpl, resolver) => {
  if (!env.GODADDY_API_KEY || !env.GODADDY_API_SECRET) {
    throw new Error(
      "GoDaddy automation needs GODADDY_API_KEY and GODADDY_API_SECRET.",
    );
  }

  const registrableDomain = getRegistrableDomain(record.domain || "");
  const desiredRecords = await buildManagedDnsTargetRecords(record, env, resolver);
  const baseUrl = env.GODADDY_API_BASE_URL || "https://api.godaddy.com";
  const headers = {
    Authorization: `sso-key ${env.GODADDY_API_KEY}:${env.GODADDY_API_SECRET}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  for (const item of desiredRecords) {
    const response = await fetchImpl(
      `${baseUrl}/v1/domains/${registrableDomain}/records/${encodeURIComponent(item.type)}/${encodeURIComponent(item.host)}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify([{ data: item.value, ttl: item.ttl || 1800 }]),
      },
    );

    if (!response.ok) {
      const errorText = typeof response.text === "function" ? await response.text() : "";
      throw new Error(errorText || `GoDaddy DNS update failed for ${item.type} ${item.host}.`);
    }
  }

  return {
    provider: "godaddy",
    recordsApplied: desiredRecords.length,
    submittedRecordCount: desiredRecords.length,
    recordNames: desiredRecords.map((item) => `${item.type} ${item.host}`),
  };
};

export const applyManagedDnsProviderRecords = async (
  tenant = {},
  record = {},
  env = process.env,
  fetchImpl = globalThis.fetch,
  resolver,
) => {
  const provider = normalizeProvider(tenant.domainProvider?.provider);

  if (provider === "manual") {
    throw new Error("Manual provider does not support automatic DNS writes.");
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required for DNS provider automation.");
  }

  if (provider === "namecheap") {
    return applyNamecheapManagedDns(record, env, fetchImpl, resolver);
  }

  if (provider === "godaddy") {
    return applyGodaddyManagedDns(record, env, fetchImpl, resolver);
  }

  throw new Error(`${provider} automatic DNS writes are not implemented yet.`);
};

export const getDomainProviderCapabilities = (tenant = {}) => {
  const provider = normalizeProvider(tenant.domainProvider?.provider);

  if (provider === "cloudflare") {
    return {
      provider,
      supportsAutomaticDnsWrites: true,
      requiresZoneId: true,
      requiresExternalCredential: true,
    };
  }

  if (provider === "namecheap") {
    return {
      provider,
      supportsAutomaticDnsWrites: true,
      requiresZoneId: false,
      requiresExternalCredential: true,
      requiresWhitelistedServerIp: true,
      supportsManagedDnsOnlyForProviderDomains: true,
    };
  }

  if (provider === "godaddy") {
    return {
      provider,
      supportsAutomaticDnsWrites: true,
      requiresZoneId: false,
      requiresExternalCredential: true,
      requiresApiSecret: true,
      supportsManagedDnsOnlyForProviderDomains: true,
    };
  }

  return {
    provider: "manual",
    supportsAutomaticDnsWrites: false,
    requiresZoneId: false,
    requiresExternalCredential: false,
  };
};
