const appendQueryParams = (path = "", params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      search.set(key, String(value).trim());
    }
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

export const buildDistributionLinkSet = ({
  baseUrl = "",
  tenantName = "Tour Operator",
  tenantSlug = "",
  referralCode = "",
  campaignLabel = "",
} = {}) => {
  const safeBaseUrl = String(baseUrl || "").replace(/\/$/, "");
  const safeTenantSlug = String(tenantSlug || "").trim().toLowerCase();
  const hostedPath = appendQueryParams("/plan-my-trip", {
    source: "hosted-social",
    campaign: campaignLabel || "social-commerce",
    referral: referralCode,
  });
  const embedPath = appendQueryParams("/embed/plan-my-trip", {
    source: "embed-widget",
    campaign: campaignLabel || "embed-launch",
    referral: referralCode,
  });
  const partnerReferralPath = appendQueryParams("/plan-my-trip", {
    source: "partner-referral",
    campaign: campaignLabel || "partner-network",
    referral: referralCode || safeTenantSlug,
  });

  return {
    tenantName,
    hostedPlannerUrl: `${safeBaseUrl}${hostedPath}`,
    embedPlannerUrl: `${safeBaseUrl}${embedPath}`,
    partnerReferralUrl: `${safeBaseUrl}${partnerReferralPath}`,
  };
};

export const buildPlannerEmbedSnippet = ({
  embedPlannerUrl = "",
  title = "Safari trip planner",
  height = 720,
} = {}) => `<iframe
  src="${embedPlannerUrl}"
  title="${title}"
  loading="lazy"
  style="width:100%;min-height:${height}px;border:0;border-radius:24px;overflow:hidden;background:#ffffff;"
></iframe>`;

export const buildPublicDistributionBootstrap = ({
  tenant = {},
  theme = {},
  siteSettings = {},
  links = {},
} = {}) => ({
  tenant: {
    id: tenant.id || tenant._id || "",
    name: tenant.name || "",
    slug: tenant.slug || "",
  },
  theme: {
    primaryColor: theme.primaryColor || "#0d9488",
    secondaryColor: theme.secondaryColor || "#eab308",
    headingFont: theme.headingFont || "'Playfair Display', serif",
    bodyFont: theme.bodyFont || "'Montserrat', sans-serif",
  },
  siteSettings: {
    whatsapp: siteSettings.whatsapp || "",
    contactEmail: siteSettings.contactEmail || siteSettings.email || "",
  },
  links,
});
