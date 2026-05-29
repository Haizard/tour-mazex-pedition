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

const providerUrl = (baseUrl = "", path = "") => `${String(baseUrl || "").replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

const assertOkResponse = async (response, label) => {
  if (response?.ok) {
    return response.json ? response.json() : {};
  }

  const body = response?.text ? await response.text().catch(() => "") : "";
  throw new Error(`${label} provider request failed${body ? `: ${body}` : ""}.`);
};

export const resolvePlatformEmailReadiness = ({ settings = {}, env = process.env } = {}) => {
  const email = settings?.email || {};
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
  const whatsapp = settings?.whatsapp || {};
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
  const social = settings?.social || {};
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
    missing: checks.flatMap((check) => check.missing || []),
  };
};

export const sendPlatformOutreachEmail = async ({
  message = {},
  prospect = {},
  settings = {},
  env = process.env,
  fetchRequest = fetch,
} = {}) => {
  const email = settings?.email || {};
  if (!present(env.PLATFORM_EMAIL_API_KEY)) {
    throw new Error("Platform email provider credentials are missing.");
  }
  if (!present(prospect.email)) {
    throw new Error("Prospect email is required before sending platform outreach email.");
  }

  const unsubscribeUrl = providerUrl(email.unsubscribeBaseUrl, `?email=${encodeURIComponent(prospect.email)}`);
  const response = await fetchRequest(env.PLATFORM_EMAIL_PROVIDER_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PLATFORM_EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${email.senderName || "Mazex"} <${email.senderEmail}>`,
      to: [prospect.email],
      subject: message.subject || "Mazex platform",
      text: `${message.body || ""}\n\nUnsubscribe: ${unsubscribeUrl}`,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
      },
    }),
  });
  const result = await assertOkResponse(response, "Email");

  return {
    provider: "email",
    providerMessageId: result.id || result.messageId || "",
    raw: result,
  };
};

export const sendPlatformOutreachWhatsApp = async ({
  message = {},
  prospect = {},
  settings = {},
  env = process.env,
  fetchRequest = fetch,
} = {}) => {
  const whatsapp = settings?.whatsapp || {};
  if (!present(env.PLATFORM_WHATSAPP_ACCESS_TOKEN)) {
    throw new Error("Platform WhatsApp access token is missing.");
  }
  if (!present(whatsapp.phoneNumberId)) {
    throw new Error("WhatsApp phone number ID is required.");
  }
  if (!present(whatsapp.defaultMarketingTemplateName)) {
    throw new Error("Approved WhatsApp marketing template is required.");
  }
  if (!present(prospect.whatsappNumber)) {
    throw new Error("Prospect WhatsApp number is required before sending platform outreach WhatsApp.");
  }

  const response = await fetchRequest(`https://graph.facebook.com/v20.0/${whatsapp.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PLATFORM_WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: prospect.whatsappNumber,
      type: "template",
      template: {
        name: whatsapp.defaultMarketingTemplateName,
        language: { code: whatsapp.templateLanguage || "en_US" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: message.body || "" }],
          },
        ],
      },
    }),
  });
  const result = await assertOkResponse(response, "WhatsApp");

  return {
    provider: "whatsapp",
    providerMessageId: result.messages?.[0]?.id || result.id || "",
    raw: result,
  };
};

export const sendPlatformOutreachMessage = async (options = {}) => {
  if (options.message?.channel === "whatsapp") {
    return sendPlatformOutreachWhatsApp(options);
  }

  return sendPlatformOutreachEmail(options);
};

export const publishPlatformSocialPostToProviders = async ({
  socialPost = {},
  settings = {},
  env = process.env,
  fetchRequest = fetch,
} = {}) => {
  if (!present(env.PLATFORM_META_ACCESS_TOKEN)) {
    throw new Error("Platform Meta access token is missing.");
  }

  const social = settings?.social || {};
  const result = {};

  if ((socialPost.platforms || []).includes("facebook")) {
    if (!present(social.facebookPageId)) throw new Error("Facebook Page ID is required.");
    const response = await fetchRequest(`https://graph.facebook.com/v20.0/${social.facebookPageId}/feed`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PLATFORM_META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: socialPost.caption || "" }),
    });
    result.facebook = await assertOkResponse(response, "Facebook");
  }

  if ((socialPost.platforms || []).includes("instagram")) {
    if (!present(social.instagramBusinessAccountId)) throw new Error("Instagram Business Account ID is required.");
    if (!socialPost.imageUrls?.[0]) throw new Error("Instagram publishing requires at least one image.");
    const creation = await assertOkResponse(
      await fetchRequest(`https://graph.facebook.com/v20.0/${social.instagramBusinessAccountId}/media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.PLATFORM_META_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_url: socialPost.imageUrls[0], caption: socialPost.caption || "" }),
      }),
      "Instagram media"
    );
    result.instagram = await assertOkResponse(
      await fetchRequest(`https://graph.facebook.com/v20.0/${social.instagramBusinessAccountId}/media_publish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.PLATFORM_META_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creation_id: creation.id }),
      }),
      "Instagram publish"
    );
  }

  return result;
};
