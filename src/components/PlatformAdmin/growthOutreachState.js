export const buildDefaultOutreachProspectForm = () => ({
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  website: "",
  sourceUrl: "",
  region: "",
  niche: "",
  notes: "",
});

export const buildDefaultOutreachCampaignForm = () => ({
  title: "",
  audience: "tour operators",
  offer: "AI website, marketplace, and lead automation demo",
  channels: ["email"],
  tone: "warm, professional, concise",
});

export const buildDefaultSocialPostForm = () => ({
  title: "",
  body: "",
  platforms: ["facebook", "instagram"],
  status: "draft",
  scheduledFor: "",
});

export const summarizeOutreachReadiness = (readiness = {}) => {
  const checks = Array.isArray(readiness.checks) ? readiness.checks : [];
  const readyCount = checks.filter((check) => check.ready).length;
  const blockedChecks = checks.filter((check) => !check.ready);

  return {
    readyCount,
    blockedCount: blockedChecks.length,
    missing: blockedChecks.flatMap((check) => (Array.isArray(check.missing) ? check.missing : [])),
  };
};

export const formatOutreachDate = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
