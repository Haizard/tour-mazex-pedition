import test from "node:test";
import assert from "node:assert/strict";
import {
  resolvePlatformEmailReadiness,
  resolvePlatformSocialReadiness,
  resolvePlatformWhatsAppReadiness,
} from "../utils/platformOutreachProviders.js";

test("email readiness requires sender identity and unsubscribe endpoint", () => {
  const readiness = resolvePlatformEmailReadiness({
    settings: { email: { senderEmail: "sales@mazex.com" } },
    env: { PLATFORM_EMAIL_API_KEY: "key" },
  });

  assert.equal(readiness.ready, false);
  assert.match(readiness.message, /unsubscribe/i);
});

test("email readiness passes with required config", () => {
  const readiness = resolvePlatformEmailReadiness({
    settings: {
      email: {
        senderEmail: "sales@mazex.com",
        senderName: "Mazex",
        postalAddress: "123 Market Street",
        unsubscribeBaseUrl: "https://mazex.example/unsubscribe",
      },
    },
    env: { PLATFORM_EMAIL_API_KEY: "key" },
  });

  assert.equal(readiness.ready, true);
});

test("whatsapp readiness requires Meta identifiers", () => {
  const readiness = resolvePlatformWhatsAppReadiness({
    settings: { whatsapp: { phoneNumberId: "phone" } },
    env: { PLATFORM_WHATSAPP_ACCESS_TOKEN: "token" },
  });

  assert.equal(readiness.ready, false);
  assert.match(readiness.message, /Business Account/i);
});

test("social readiness requires page and instagram identifiers for both platforms", () => {
  const readiness = resolvePlatformSocialReadiness({
    settings: { social: { facebookPageId: "page" } },
    platforms: ["facebook", "instagram"],
    env: { PLATFORM_META_ACCESS_TOKEN: "token" },
  });

  assert.equal(readiness.ready, false);
  assert.match(readiness.message, /Instagram/i);
});
