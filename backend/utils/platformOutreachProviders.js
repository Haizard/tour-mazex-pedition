const present = (value = "") => Boolean(String(value || "").trim());

const notReady = (channel, message, missing = []) => ({
  channel,
  ready: false,
  message,
  missing,
});

const ready = (channel) => ({
  channel,
  ready: true,
  message: "",
  missing: [],
});

export const resolvePlatformEmailReadiness = ({ settings = {}, env = process.env } = {}) => {
  const email = settings.email || {};
  const missing = [];
  if (!present(env.PLATFORM_EMAIL_API_KEY) && !present(env.PLATFORM_SMTP_HOST)) {
    missing.push("email provider credentials");
  }
  if (!present(email.senderEmail)) missing.push("sender email");
  if (!present(email.senderName)) missing.push("sender name");
  if (!present(email.postalAddress)) missing.push("postal address");
  if (!present(email.unsubscribeBaseUrl)) missing.push("unsubscribe endpoint");

  return missing.length
    ? notReady("email", `Email readiness failed: missing ${missing.join(", ")}.`, missing)
    : ready("email");
};

export const resolvePlatformWhatsAppReadiness = ({ settings = {}, env = process.env } = {}) => {
  const whatsapp = settings.whatsapp || {};
  const missing = [];
  if (!present(env.PLATFORM_WHATSAPP_ACCESS_TOKEN)) missing.push("Meta access token");
  if (!present(whatsapp.businessAccountId)) missing.push("WhatsApp Business Account ID");
  if (!present(whatsapp.phoneNumberId)) missing.push("WhatsApp phone number ID");
  if (!present(whatsapp.defaultMarketingTemplateName)) missing.push("approved marketing template");
  if (!present(whatsapp.webhookVerifyToken)) missing.push("webhook verify token");

  return missing.length
    ? notReady("whatsapp", `WhatsApp readiness failed: missing ${missing.join(", ")}.`, missing)
    : ready("whatsapp");
};

export const resolvePlatformSocialReadiness = ({
  settings = {},
  platforms = [],
  env = process.env,
} = {}) => {
  const social = settings.social || {};
  const requestedPlatforms = platforms.length ? platforms : ["facebook", "instagram"];
  const missing = [];
  if (!present(env.PLATFORM_META_ACCESS_TOKEN)) missing.push("Meta access token");
  if (requestedPlatforms.includes("facebook") && !present(social.facebookPageId)) {
    missing.push("Facebook Page ID");
  }
  if (requestedPlatforms.includes("instagram") && !present(social.instagramBusinessAccountId)) {
    missing.push("Instagram Business Account ID");
  }

  return missing.length
    ? notReady("social", `Social readiness failed: missing ${missing.join(", ")}.`, missing)
    : ready("social");
};

export const resolvePlatformOutreachReadiness = ({
  settings = {},
  channels = [],
  env = process.env,
} = {}) => {
  const checks = [];
  if (channels.includes("email")) checks.push(resolvePlatformEmailReadiness({ settings, env }));
  if (channels.includes("whatsapp")) checks.push(resolvePlatformWhatsAppReadiness({ settings, env }));
  if (channels.includes("facebook") || channels.includes("instagram")) {
    checks.push(resolvePlatformSocialReadiness({ settings, platforms: channels, env }));
  }

  return {
    ready: checks.every((check) => check.ready),
    checks,
  };
};
