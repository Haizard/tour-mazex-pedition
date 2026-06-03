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

export const buildDefaultOutreachSettingsForm = (settings = {}) => ({
  senderName: settings.email?.senderName || "",
  senderEmail: settings.email?.senderEmail || "",
  postalAddress: settings.email?.postalAddress || "",
  unsubscribeBaseUrl: settings.email?.unsubscribeBaseUrl || "",
  emailWebhookSecret: settings.email?.webhookSecret || "",
  whatsappBusinessAccountId: settings.whatsapp?.businessAccountId || "",
  whatsappPhoneNumberId: settings.whatsapp?.phoneNumberId || "",
  whatsappTemplateName: settings.whatsapp?.defaultMarketingTemplateName || "",
  whatsappWebhookVerifyToken: settings.whatsapp?.webhookVerifyToken || "",
  facebookPageId: settings.social?.facebookPageId || "",
  instagramBusinessAccountId: settings.social?.instagramBusinessAccountId || "",
  maxEmailPerHour: String(settings.rateLimits?.maxEmailPerHour || 50),
  maxWhatsAppPerHour: String(settings.rateLimits?.maxWhatsAppPerHour || 20),
  maxSocialPostsPerDay: String(settings.rateLimits?.maxSocialPostsPerDay || 10),
  escalationKeywords: (settings.escalationRules?.[0]?.keywords || ["discount", "refund", "angry", "legal", "guarantee"]).join(", "),
  lowConfidenceThreshold: String(settings.escalationRules?.[0]?.minConfidence || 0.65),
});

export const buildDefaultThreadConversionForm = (conversion = {}) => ({
  stage: conversion.stage || "demo_booked",
  revenueAmount: conversion.revenueAmount ? String(conversion.revenueAmount) : "",
  currency: conversion.currency || "USD",
  notes: conversion.notes || "",
});

export const buildProviderCredentialWizardSteps = ({ baseUrl = "", readiness = {} } = {}) => {
  const normalizedBaseUrl = String(baseUrl || "").replace(/\/$/, "");
  const checks = Array.isArray(readiness.checks) ? readiness.checks : [];
  const isReady = (channel) => checks.some((check) => check.channel === channel && check.ready);
  return [
    {
      label: "AI generation",
      env: "GEMINI_API_KEY / GOOGLE_API_KEY / PLATFORM_OUTREACH_AI_API_KEY",
      ready: true,
      note: "Add one AI key in the deployment environment for reviewed copy generation.",
    },
    {
      label: "Email",
      env: "PLATFORM_EMAIL_API_KEY or PLATFORM_SMTP_HOST",
      ready: isReady("email"),
      webhookUrl: `${normalizedBaseUrl}/api/platform-admin/outreach/webhooks/email`,
      note: "Point provider reply webhooks here and pass the configured webhook token.",
    },
    {
      label: "WhatsApp",
      env: "PLATFORM_WHATSAPP_ACCESS_TOKEN",
      ready: isReady("whatsapp"),
      webhookUrl: `${normalizedBaseUrl}/api/platform-admin/outreach/webhooks/whatsapp`,
      note: "Use this Meta webhook URL for inbound messages and STOP automation.",
    },
    {
      label: "Social",
      env: "PLATFORM_META_ACCESS_TOKEN",
      ready: isReady("social"),
      note: "Connect Facebook Page and Instagram Business IDs in settings.",
    },
  ];
};

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
