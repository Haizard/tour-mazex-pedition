const PLATFORM_HOST_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?(?:mazexpeditions\.vercel\.app|mazexpeditions\.com|tourism-website-inky\.vercel\.app)(?:\/|$)/i;

const EXTERNAL_LINK_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

export const normalizeTenantLinkInput = (value = "") => value.toString().trim();

export const isExternalTenantLink = (value = "") =>
  EXTERNAL_LINK_PATTERN.test(normalizeTenantLinkInput(value));

export const validateTenantManagedLink = (value = "", label = "Link") => {
  const normalizedValue = normalizeTenantLinkInput(value);

  if (!normalizedValue) {
    return `${label} is required.`;
  }

  if (PLATFORM_HOST_PATTERN.test(normalizedValue)) {
    return `${label} should use an internal path like /blogs instead of a full platform URL.`;
  }

  if (normalizedValue.startsWith("/demo/")) {
    return `${label} should not include /demo/... paths. Use a tenant-relative path like /blogs instead.`;
  }

  if (!isExternalTenantLink(normalizedValue) && !normalizedValue.startsWith("/")) {
    return `${label} should start with / for internal pages, or use a full external URL.`;
  }

  return "";
};

export const validateTenantManagedLinks = (entries = []) =>
  entries
    .map(({ label, value }) => validateTenantManagedLink(value, label))
    .filter(Boolean);
