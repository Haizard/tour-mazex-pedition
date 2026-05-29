import test from "node:test";
import assert from "node:assert/strict";

import {
  publishPlatformSocialPostToProviders,
  sendPlatformOutreachEmail,
  sendPlatformOutreachMessage,
  sendPlatformOutreachWhatsApp,
} from "../utils/platformOutreachProviders.js";

test("sendPlatformOutreachEmail posts to the configured email provider", async () => {
  const calls = [];
  const result = await sendPlatformOutreachEmail({
    message: { subject: "Hello", body: "Demo?" },
    prospect: { email: "sales@example.com" },
    settings: {
      email: {
        senderName: "Mazex",
        senderEmail: "hello@mazex.com",
        unsubscribeBaseUrl: "https://mazex.test/unsubscribe",
      },
    },
    env: { PLATFORM_EMAIL_API_KEY: "email-key", PLATFORM_EMAIL_PROVIDER_URL: "https://email.test/send" },
    fetchRequest: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, json: async () => ({ id: "email-1" }) };
    },
  });

  assert.equal(result.providerMessageId, "email-1");
  assert.equal(calls[0].url, "https://email.test/send");
  assert.match(calls[0].init.body, /List-Unsubscribe/);
});

test("sendPlatformOutreachWhatsApp sends approved template messages", async () => {
  const result = await sendPlatformOutreachWhatsApp({
    message: { body: "Hello" },
    prospect: { whatsappNumber: "+255700111222" },
    settings: {
      whatsapp: {
        phoneNumberId: "phone-id",
        defaultMarketingTemplateName: "mazex_intro",
      },
    },
    env: { PLATFORM_WHATSAPP_ACCESS_TOKEN: "wa-token" },
    fetchRequest: async () => ({ ok: true, json: async () => ({ messages: [{ id: "wa-1" }] }) }),
  });

  assert.equal(result.providerMessageId, "wa-1");
});

test("sendPlatformOutreachMessage dispatches by channel", async () => {
  const result = await sendPlatformOutreachMessage({
    message: { channel: "email", subject: "Hello", body: "Demo?" },
    prospect: { email: "sales@example.com" },
    settings: { email: { senderName: "Mazex", senderEmail: "hello@mazex.com", unsubscribeBaseUrl: "https://mazex.test/unsubscribe" } },
    env: { PLATFORM_EMAIL_API_KEY: "email-key" },
    fetchRequest: async () => ({ ok: true, json: async () => ({ id: "email-1" }) }),
  });

  assert.equal(result.providerMessageId, "email-1");
});

test("publishPlatformSocialPostToProviders publishes to requested platform accounts", async () => {
  const paths = [];
  const result = await publishPlatformSocialPostToProviders({
    socialPost: { caption: "Launch", platforms: ["facebook"], imageUrls: [] },
    settings: { social: { facebookPageId: "page-id" } },
    env: { PLATFORM_META_ACCESS_TOKEN: "meta-token" },
    fetchRequest: async (url) => {
      paths.push(url);
      return { ok: true, json: async () => ({ id: "post-1" }) };
    },
  });

  assert.deepEqual(result, { facebook: { id: "post-1" } });
  assert.match(paths[0], /page-id\/feed/);
});
