import dns from "node:dns/promises";
import { getDemoBaseUrl } from "./domainProvisioning.js";
import { normalizeHostname } from "./tenantContext.js";

const DEFAULT_RESOLVER = {
  resolveTxt: (...args) => dns.resolveTxt(...args),
  resolveCname: (...args) => dns.resolveCname(...args),
  resolve4: (...args) => dns.resolve4(...args),
};

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

export const isSubdomainDomain = (domain = "") => {
  const normalized = normalizeDomain(domain);
  const parts = normalized.split(".");

  if (parts.length <= 2) {
    return false;
  }

  const publicSuffix = parts.slice(-2).join(".");
  if (MULTI_PART_PUBLIC_SUFFIXES.has(publicSuffix)) {
    return parts.length > 3;
  }

  return true;
};

export const getPlatformDomainTargetHost = (env = process.env) => {
  const explicitTarget = normalizeHostname(env.PLATFORM_DOMAIN_TARGET || "");
  if (explicitTarget) {
    return explicitTarget;
  }

  try {
    return normalizeHostname(new URL(getDemoBaseUrl()).hostname);
  } catch (_error) {
    return normalizeHostname(env.SITE_URL || env.VITE_SITE_URL || "");
  }
};

export const getExpectedApexAddresses = async (
  env = process.env,
  resolver = DEFAULT_RESOLVER,
) => {
  const explicitAddresses = String(env.PLATFORM_APEX_ADDRESSES || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (explicitAddresses.length) {
    return [...new Set(explicitAddresses)].sort();
  }

  const targetHost = getPlatformDomainTargetHost(env);
  if (!targetHost) {
    return [];
  }

  try {
    const addresses = await resolver.resolve4(targetHost);
    return [...new Set((addresses || []).map((item) => item.toString().trim()))].sort();
  } catch (_error) {
    return [];
  }
};

export const buildExpectedRoutingProfile = async (
  domain,
  env = process.env,
  resolver = DEFAULT_RESOLVER,
) => {
  const normalizedDomain = normalizeDomain(domain);
  const targetHost = getPlatformDomainTargetHost(env);

  if (isSubdomainDomain(normalizedDomain)) {
    return {
      type: "CNAME",
      targetHost,
      targetValue: targetHost,
      targetSummary: targetHost,
    };
  }

  const addresses = await getExpectedApexAddresses(env, resolver);
  return {
    type: "A",
    targetHost,
    targetValue: addresses,
    targetSummary: addresses.join(", "),
  };
};

const flattenTxtRecords = (records = []) =>
  records.map((entry) => (Array.isArray(entry) ? entry.join("") : String(entry || "")));

export const verifyCustomDomainRecord = async (
  record = {},
  env = process.env,
  resolver = DEFAULT_RESOLVER,
) => {
  const domain = normalizeDomain(record.domain || "");
  const verificationHost = normalizeDomain(record.verificationHost || "");
  const verificationValue = String(record.verificationValue || "").trim();
  const routingProfile = await buildExpectedRoutingProfile(domain, env, resolver);

  let txtValues = [];
  let txtVerified = false;
  let routingValues = [];
  let routingVerified = false;

  try {
    txtValues = flattenTxtRecords(await resolver.resolveTxt(verificationHost));
    txtVerified = txtValues.includes(verificationValue);
  } catch (_error) {
    txtValues = [];
  }

  try {
    if (routingProfile.type === "CNAME") {
      routingValues = (await resolver.resolveCname(domain)).map((value) =>
        normalizeDomain(value),
      );
      routingVerified = routingValues.includes(normalizeDomain(routingProfile.targetHost));
    } else {
      routingValues = (await resolver.resolve4(domain)).map((value) =>
        value.toString().trim(),
      );
      const expectedValues = Array.isArray(routingProfile.targetValue)
        ? routingProfile.targetValue
        : [];
      routingVerified =
        expectedValues.length > 0 &&
        expectedValues.every((value) => routingValues.includes(value));
    }
  } catch (_error) {
    routingValues = [];
  }

  const verified = txtVerified && routingVerified;
  const issues = [];

  if (!txtVerified) {
    issues.push(
      `TXT verification record is missing at ${verificationHost}. Expected value: ${verificationValue}.`,
    );
  }

  if (!routingVerified) {
    if (routingProfile.type === "CNAME") {
      issues.push(
        `Domain routing is not pointing to ${routingProfile.targetHost}. Current CNAME: ${routingValues.join(", ") || "none"}.`,
      );
    } else {
      issues.push(
        `Apex routing is not pointing to the platform IPs. Expected A records: ${routingProfile.targetSummary || "unavailable"}. Current A records: ${routingValues.join(", ") || "none"}.`,
      );
    }
  }

  return {
    verified,
    status: verified ? "verified" : routingValues.length || txtValues.length ? "error" : "pending",
    checkedAt: new Date(),
    verificationHost,
    verificationValue,
    expectedTarget: routingProfile.targetSummary,
    routingType: routingProfile.type,
    observedTxtValues: txtValues,
    observedRoutingValues: routingValues,
    errorMessage: issues.join(" "),
  };
};
