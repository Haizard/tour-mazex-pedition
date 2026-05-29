import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDefaultOutreachCampaignForm,
  buildDefaultOutreachProspectForm,
  buildDefaultOutreachSettingsForm,
  buildDefaultSocialPostForm,
  summarizeOutreachReadiness,
} from "./growthOutreachState.js";

test("growth outreach forms start with safe, review-first defaults", () => {
  assert.deepEqual(buildDefaultOutreachProspectForm(), {
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

  assert.deepEqual(buildDefaultOutreachCampaignForm(), {
    title: "",
    audience: "tour operators",
    offer: "AI website, marketplace, and lead automation demo",
    channels: ["email"],
    tone: "warm, professional, concise",
  });

  assert.deepEqual(buildDefaultSocialPostForm(), {
    title: "",
    body: "",
    platforms: ["facebook", "instagram"],
    status: "draft",
    scheduledFor: "",
  });
});

test("buildDefaultOutreachSettingsForm maps stored settings into editable compliance fields", () => {
  assert.deepEqual(
    buildDefaultOutreachSettingsForm({
      email: {
        senderName: "Mazex",
        senderEmail: "hello@mazex.com",
        postalAddress: "Arusha",
        unsubscribeBaseUrl: "https://mazex.test/unsubscribe",
      },
      whatsapp: {
        businessAccountId: "waba",
        phoneNumberId: "phone",
        defaultMarketingTemplateName: "intro",
        webhookVerifyToken: "verify",
      },
      social: {
        facebookPageId: "page",
        instagramBusinessAccountId: "ig",
      },
      rateLimits: {
        maxEmailPerHour: 25,
        maxWhatsAppPerHour: 10,
        maxSocialPostsPerDay: 3,
      },
    }),
    {
      senderName: "Mazex",
      senderEmail: "hello@mazex.com",
      postalAddress: "Arusha",
      unsubscribeBaseUrl: "https://mazex.test/unsubscribe",
      whatsappBusinessAccountId: "waba",
      whatsappPhoneNumberId: "phone",
      whatsappTemplateName: "intro",
      whatsappWebhookVerifyToken: "verify",
      facebookPageId: "page",
      instagramBusinessAccountId: "ig",
      maxEmailPerHour: "25",
      maxWhatsAppPerHour: "10",
      maxSocialPostsPerDay: "3",
    },
  );
});

test("summarizeOutreachReadiness counts ready and blocked channels", () => {
  const summary = summarizeOutreachReadiness({
    checks: [
      { channel: "email", ready: true },
      { channel: "whatsapp", ready: false, missing: ["WhatsApp token"] },
      { channel: "social", ready: false, missing: ["Facebook Page ID", "Instagram Business Account ID"] },
    ],
  });

  assert.equal(summary.readyCount, 1);
  assert.equal(summary.blockedCount, 2);
  assert.deepEqual(summary.missing, ["WhatsApp token", "Facebook Page ID", "Instagram Business Account ID"]);
});
