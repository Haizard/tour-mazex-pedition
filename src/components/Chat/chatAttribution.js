const resolveCampaignLabel = (locationLike = {}) => {
  const search = String(locationLike.search || "").trim();
  const params = new URLSearchParams(search);

  return (
    params.get("utm_campaign") ||
    params.get("campaign") ||
    params.get("ref") ||
    ""
  ).trim();
};

const resolveSourceHint = (locationLike = {}) => {
  const search = String(locationLike.search || "").trim();
  const pathname = String(locationLike.pathname || "").trim();
  const params = new URLSearchParams(search);

  return (
    params.get("utm_source") ||
    params.get("source") ||
    (pathname.startsWith("/discover") ? "marketplace-discovery" : "") ||
    (pathname.startsWith("/demo/") ? "tenant-website" : "") ||
    "website"
  ).trim();
};

const resolveReferrerHost = (referrer = "") => {
  try {
    return referrer ? new URL(referrer).host : "";
  } catch (error) {
    return "";
  }
};

export const buildChatVisitorProfile = ({
  navigatorLanguage = "",
  timezone = "",
  locationLike = {},
  referrer = "",
} = {}) => ({
  preferredLocale: navigatorLanguage || "",
  browserLanguage: navigatorLanguage || "",
  timezone: timezone || "",
  currentPage: locationLike.pathname || "",
  currentUrl: locationLike.href || "",
  referrer: referrer || "",
  referrerHost: resolveReferrerHost(referrer),
  campaignLabel: resolveCampaignLabel(locationLike),
  sourceHint: resolveSourceHint(locationLike),
});

