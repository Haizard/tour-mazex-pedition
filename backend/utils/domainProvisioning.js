export const slugifyTenantValue = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getDemoDomainRoot = () =>
  process.env.PLATFORM_DEMO_DOMAIN_ROOT || "demo.mazex.co.tz";

export const getDemoBaseUrl = () =>
  (
    process.env.PLATFORM_DEMO_BASE_URL ||
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    "https://mazexpeditions.vercel.app"
  ).replace(/\/+$/, "");

export const buildDemoDomain = (subdomain = "") => {
  const normalizedSubdomain = slugifyTenantValue(subdomain);

  if (!normalizedSubdomain) {
    return "";
  }

  return `${getDemoBaseUrl()}/demo/${normalizedSubdomain}`;
};

export const normalizeRequestedDomains = (domains = []) =>
  (domains || [])
    .map((domain) => domain?.toString().trim().toLowerCase())
    .filter(Boolean);

export const normalizeAnnualDomainPrice = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 50;
  }

  return Math.min(200, Math.max(50, Math.round(numericValue)));
};

export const calculateNextRenewalDate = (baseDate = new Date()) => {
  const nextDate = new Date(baseDate);
  nextDate.setFullYear(nextDate.getFullYear() + 1);
  return nextDate;
};

