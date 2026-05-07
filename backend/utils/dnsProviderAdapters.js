import { buildExpectedRoutingProfile } from "./domainDnsVerifier.js";

const normalizeProvider = (value = "") =>
  value.toString().trim().toLowerCase() || "manual";

const buildTxtRecord = (record = {}) => ({
  type: "TXT",
  host: record.verificationHost || "",
  value: record.verificationValue || "",
  purpose: "Domain ownership verification",
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
    instructions:
      provider === "cloudflare"
        ? autoManageDns
          ? "Cloudflare is configured for automatic DNS management once valid API credentials are present."
          : "Use Cloudflare DNS to add the required TXT and routing records manually, or enable automatic DNS management."
        : "Add the required TXT and routing records at your DNS provider, then run DNS verification from the platform.",
  };
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

  return {
    provider: "manual",
    supportsAutomaticDnsWrites: false,
    requiresZoneId: false,
    requiresExternalCredential: false,
  };
};
