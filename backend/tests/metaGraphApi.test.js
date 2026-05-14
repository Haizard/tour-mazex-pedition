import test from "node:test";
import assert from "node:assert/strict";

import {
  publishFacebookPost,
  resolveMetaPublishingContext,
  verifyWhatsAppAccountConnection,
} from "../utils/metaGraphApi.js";

const createJsonResponse = (payload, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  async json() {
    return payload;
  },
  async text() {
    return JSON.stringify(payload);
  },
});

test("resolveMetaPublishingContext upgrades a Meta connection to a live page publishing token", async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (url) => {
    requests.push(String(url));

    if (String(url).includes("/me/accounts")) {
      return createJsonResponse({
        data: [
          {
            id: "page_123",
            name: "MAZ Page",
            access_token: "page_token_live",
            tasks: ["CREATE_CONTENT"],
            instagram_business_account: {
              id: "ig_123",
              username: "mazexpeditions",
            },
          },
        ],
      });
    }

    if (String(url).includes("/page_123?")) {
      return createJsonResponse({
        id: "page_123",
        name: "MAZ Page",
        instagram_business_account: {
          id: "ig_123",
          username: "mazexpeditions",
        },
      });
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    const context = await resolveMetaPublishingContext({
      pageId: "page_123",
      accessToken: "user_token",
      instagramBusinessAccountId: "",
    });

    assert.equal(context.pageAccessToken, "page_token_live");
    assert.equal(context.pageName, "MAZ Page");
    assert.equal(context.instagramBusinessAccountId, "ig_123");
    assert.equal(context.instagramUsername, "mazexpeditions");
    assert.ok(requests.some((url) => url.includes("access_token=user_token")));
    assert.ok(requests.some((url) => url.includes("access_token=page_token_live")));
  } finally {
    global.fetch = originalFetch;
  }
});

test("publishFacebookPost posts with the resolved page access token instead of the original token", async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });

    if (String(url).includes("/me/accounts")) {
      return createJsonResponse({
        data: [
          {
            id: "page_987",
            name: "Safari Stories",
            access_token: "page_token_987",
          },
        ],
      });
    }

    if (String(url).includes("/page_987?")) {
      return createJsonResponse({
        id: "page_987",
        name: "Safari Stories",
      });
    }

    if (String(url).includes("/page_987/photos")) {
      return createJsonResponse({ id: "fb_post_1" });
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    const result = await publishFacebookPost(
      {
        pageId: "page_987",
        accessToken: "user_token_987",
      },
      {
        caption: "Fresh safari story",
        imageUrls: ["https://example.com/story.jpg"],
      }
    );

    assert.equal(result.id, "fb_post_1");
    const publishRequest = requests.find((request) => request.url.includes("/page_987/photos"));
    assert.ok(publishRequest);
    assert.ok(publishRequest.url.includes("access_token=page_token_987"));
    assert.ok(!publishRequest.url.includes("access_token=user_token_987"));
  } finally {
    global.fetch = originalFetch;
  }
});

test("verifyWhatsAppAccountConnection validates the phone number id through Meta Graph", async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });

    if (String(url).includes("/123456789?")) {
      return createJsonResponse({
        id: "123456789",
        display_phone_number: "+255700000000",
        verified_name: "MAZ Expeditions",
        quality_rating: "GREEN",
      });
    }

    if (String(url).includes("/waba_123?")) {
      return createJsonResponse({
        id: "waba_123",
        name: "MAZ WhatsApp",
      });
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    const result = await verifyWhatsAppAccountConnection({
      accessToken: "wa_token",
      whatsappPhoneNumberId: "123456789",
      whatsappBusinessAccountId: "waba_123",
    });

    assert.equal(result.phoneNumberId, "123456789");
    assert.equal(result.displayPhoneNumber, "+255700000000");
    assert.equal(result.verifiedName, "MAZ Expeditions");
    assert.equal(result.businessName, "MAZ WhatsApp");
    assert.equal(
      requests[0].init.headers.Authorization,
      "Bearer wa_token"
    );
  } finally {
    global.fetch = originalFetch;
  }
});
