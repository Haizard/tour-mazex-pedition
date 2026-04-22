const META_GRAPH_API_VERSION =
  process.env.META_GRAPH_API_VERSION || "v22.0";

const buildGraphUrl = (path) =>
  `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${path}`;

const assertResponse = async (response) => {
  if (response.ok) {
    return response.json();
  }

  const errorBody = await response.text();
  throw new Error(errorBody || "Meta API request failed.");
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

export const verifyMetaAccountConnection = async (account) => {
  const response = await fetch(
    `${buildGraphUrl(account.pageId)}?fields=id,name&access_token=${encodeURIComponent(
      account.accessToken
    )}`
  );

  return assertResponse(response);
};

export const publishFacebookPost = async (account, socialPost) => {
  const payload = buildFacebookPostPayload({
    caption: socialPost.caption,
    imageUrl: socialPost.imageUrls?.[0] || "",
  });

  const response = await fetch(buildGraphUrl(`${account.pageId}/photos`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      access_token: account.accessToken,
    }),
  });

  return assertResponse(response);
};

export const publishInstagramPost = async (account, socialPost) => {
  const creationResponse = await fetch(
    buildGraphUrl(`${account.instagramBusinessAccountId}/media`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...buildInstagramMediaPayload({
          caption: socialPost.caption,
          imageUrl: socialPost.imageUrls?.[0] || "",
        }),
        access_token: account.accessToken,
      }),
    }
  );

  const creation = await assertResponse(creationResponse);

  const publishResponse = await fetch(
    buildGraphUrl(`${account.instagramBusinessAccountId}/media_publish`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: creation.id,
        access_token: account.accessToken,
      }),
    }
  );

  return assertResponse(publishResponse);
};

export const sendWhatsAppTextMessage = async (account, { phone, message }) => {
  const response = await fetch(
    buildGraphUrl(`${account.whatsappPhoneNumberId}/messages`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account.accessToken}`,
      },
      body: JSON.stringify(
        buildWhatsAppTextPayload({
          phone,
          message,
        })
      ),
    }
  );

  return assertResponse(response);
};
