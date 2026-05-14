const META_GRAPH_API_VERSION =
  process.env.META_GRAPH_API_VERSION || "v22.0";

const buildGraphUrl = (path) =>
  `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${path}`;

const buildHelpfulMetaErrorMessage = (errorBody) => {
  const parsedBody =
    typeof errorBody === "string"
      ? (() => {
          try {
            return JSON.parse(errorBody);
          } catch (_error) {
            return errorBody;
          }
        })()
      : errorBody;

  const message =
    parsedBody?.error?.message ||
    (typeof parsedBody === "string" ? parsedBody : "") ||
    "Meta API request failed.";

  const code = parsedBody?.error?.code;

  if (message.includes("publish_actions")) {
    return (
      "Meta rejected this publishing token because it relies on the deprecated publish_actions permission. " +
      "Reconnect the Meta account using a fresh Facebook Page publishing token or a user token that can manage the Page " +
      "so the platform can resolve a live Page access token before publishing."
    );
  }

  if (message.includes("Session has expired")) {
    return (
      "The connected Meta access token has expired. Reconnect the Meta account with a fresh long-lived token, " +
      "then verify the account again before publishing."
    );
  }

  if (message.includes("pages_manage_posts")) {
    return (
      "Meta rejected live publishing because the connected app or token does not currently have pages_manage_posts access. " +
      "Use a Meta app approved for Page publishing and reconnect with a token that can manage and publish to the target Facebook Page."
    );
  }

  if (code === 131030 || message.includes("Recipient phone number not in allowed list")) {
    return (
      "WhatsApp Business is still in Meta test mode for this sender. Add the traveler's phone number to the allowed recipient list " +
      "in your WhatsApp app settings, or move the WhatsApp sender to production before sending live lead messages."
    );
  }

  if (message.includes("Unsupported post request")) {
    return (
      "Meta could not publish to the selected Page. Reconnect the Meta account with access to the target Facebook Page " +
      "and confirm the saved Page ID still belongs to that connection."
    );
  }

  return message;
};

const assertResponse = async (response) => {
  if (response.ok) {
    return response.json();
  }

  const errorBody = await response.text();
  throw new Error(buildHelpfulMetaErrorMessage(errorBody));
};

const fetchGraph = async (
  path,
  { method = "GET", accessToken = "", headers = {}, query = {}, body } = {}
) => {
  const searchParams = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  if (accessToken && !headers.Authorization) {
    searchParams.set("access_token", accessToken);
  }

  const requestHeaders = { ...headers };
  const requestInit = {
    method,
    headers: requestHeaders,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    requestInit.body = JSON.stringify(body);
  }

  const url = `${buildGraphUrl(path)}${searchParams.toString() ? `?${searchParams}` : ""}`;
  const response = await fetch(url, requestInit);
  return assertResponse(response);
};

export const buildFacebookPostPayload = ({ caption = "", imageUrl = "" }) => ({
  message: caption,
  url: imageUrl,
});

export const buildInstagramMediaPayload = ({ caption = "", imageUrl = "" }) => ({
  image_url: imageUrl,
  caption,
});

export const buildWhatsAppTextPayload = ({ phone = "", message = "" }) => ({
  messaging_product: "whatsapp",
  to: phone.toString().replace(/[^\d]/g, ""),
  type: "text",
  text: {
    body: message,
  },
});

export const buildWhatsAppTemplatePayload = ({ phone = "", templateName = "", language = "en_US", components = [] }) => ({
  messaging_product: "whatsapp",
  to: phone.toString().replace(/[^\d]/g, ""),
  type: "template",
  template: {
    name: templateName,
    language: {
      code: language,
    },
    components,
  },
});

export const resolveMetaPublishingContext = async (account) => {
  let pageAccessToken = account.accessToken;
  let pageName = "";
  let instagramBusinessAccountId = account.instagramBusinessAccountId || "";
  let instagramUsername = "";
  let pageTasks = [];

  try {
    const accountsResponse = await fetchGraph("me/accounts", {
      accessToken: account.accessToken,
      query: {
        fields: "id,name,access_token,tasks,instagram_business_account{id,username}",
      },
    });

    const managedPage = (accountsResponse?.data || []).find(
      (page) => String(page?.id || "") === String(account.pageId || "")
    );

    if (managedPage) {
      pageAccessToken = managedPage.access_token || pageAccessToken;
      pageName = managedPage.name || pageName;
      instagramBusinessAccountId =
        instagramBusinessAccountId ||
        managedPage.instagram_business_account?.id ||
        "";
      instagramUsername =
        managedPage.instagram_business_account?.username || instagramUsername;
      pageTasks = Array.isArray(managedPage.tasks) ? managedPage.tasks : [];
    }
  } catch (_error) {
    // Some tenants paste a Page access token directly instead of a user token.
    // In that case /me/accounts may not be available, so we fall back to using
    // the provided token against the target Page itself below.
  }

  const pageProfile = await fetchGraph(account.pageId, {
    accessToken: pageAccessToken,
    query: {
      fields: "id,name,instagram_business_account{id,username}",
    },
  });

  if (String(pageProfile?.id || "") !== String(account.pageId || "")) {
    throw new Error(
      "Meta could not confirm the saved Facebook Page ID for this connection. Reconnect the Meta account and verify the Page again."
    );
  }

  return {
    pageId: pageProfile.id || account.pageId,
    pageName: pageProfile.name || pageName || "",
    pageAccessToken,
    instagramBusinessAccountId:
      instagramBusinessAccountId ||
      pageProfile.instagram_business_account?.id ||
      "",
    instagramUsername:
      instagramUsername ||
      pageProfile.instagram_business_account?.username ||
      "",
    tasks: pageTasks,
  };
};

export const verifyMetaAccountConnection = async (account) => {
  const context = await resolveMetaPublishingContext(account);

  return {
    ok: true,
    provider: "meta",
    pageId: context.pageId,
    pageName: context.pageName,
    instagramBusinessAccountId: context.instagramBusinessAccountId,
    instagramUsername: context.instagramUsername,
    tasks: context.tasks,
    capabilities: {
      facebookPublish: true,
      instagramPublish: Boolean(context.instagramBusinessAccountId),
    },
  };
};

export const verifyWhatsAppAccountConnection = async (account) => {
  const phoneProfile = await fetchGraph(account.whatsappPhoneNumberId, {
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
    },
    query: {
      fields: "id,display_phone_number,verified_name,quality_rating",
    },
  });

  let businessProfile = null;

  if (account.whatsappBusinessAccountId) {
    businessProfile = await fetchGraph(account.whatsappBusinessAccountId, {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
      },
      query: {
        fields: "id,name",
      },
    }).catch(() => null);
  }

  return {
    ok: true,
    provider: "whatsapp",
    whatsappBusinessAccountId:
      businessProfile?.id || account.whatsappBusinessAccountId || "",
    businessName: businessProfile?.name || "",
    phoneNumberId: phoneProfile?.id || account.whatsappPhoneNumberId,
    displayPhoneNumber: phoneProfile?.display_phone_number || "",
    verifiedName: phoneProfile?.verified_name || "",
    qualityRating: phoneProfile?.quality_rating || "",
  };
};

export const publishFacebookPost = async (account, socialPost) => {
  const context = await resolveMetaPublishingContext(account);
  const imageUrl = socialPost.imageUrls?.[0] || "";

  if (imageUrl) {
    return fetchGraph(`${context.pageId}/photos`, {
      method: "POST",
      accessToken: context.pageAccessToken,
      body: {
        ...buildFacebookPostPayload({
          caption: socialPost.caption,
          imageUrl,
        }),
        published: true,
      },
    });
  }

  return fetchGraph(`${context.pageId}/feed`, {
    method: "POST",
    accessToken: context.pageAccessToken,
    body: {
      message: socialPost.caption,
    },
  });
};

export const publishInstagramPost = async (account, socialPost) => {
  const context = await resolveMetaPublishingContext(account);
  const instagramBusinessAccountId =
    account.instagramBusinessAccountId ||
    context.instagramBusinessAccountId ||
    "";

  if (!instagramBusinessAccountId) {
    throw new Error("Instagram publishing requires an Instagram Business Account ID.");
  }

  if (!socialPost.imageUrls?.[0]) {
    throw new Error("Instagram publishing requires at least one image.");
  }

  const creation = await fetchGraph(`${instagramBusinessAccountId}/media`, {
    method: "POST",
    accessToken: context.pageAccessToken,
    body: buildInstagramMediaPayload({
      caption: socialPost.caption,
      imageUrl: socialPost.imageUrls?.[0] || "",
    }),
  });

  return fetchGraph(`${instagramBusinessAccountId}/media_publish`, {
    method: "POST",
    accessToken: context.pageAccessToken,
    body: {
      creation_id: creation.id,
    },
  });
};

export const sendWhatsAppTextMessage = async (account, { phone, message }) => {
  return fetchGraph(`${account.whatsappPhoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
    },
    body: buildWhatsAppTextPayload({
      phone,
      message,
    }),
  });
};

export const sendWhatsAppTemplateMessage = async (account, { phone, templateName, language = "en_US", components = [] }) => {
  return fetchGraph(`${account.whatsappPhoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
    },
    body: buildWhatsAppTemplatePayload({
      phone,
      templateName,
      language,
      components,
    }),
  });
};
