import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDefaultOutreachCampaignForm,
  buildDefaultOutreachProspectForm,
  buildDefaultOutreachSettingsForm,
  buildDefaultSocialPostForm,
  buildDefaultThreadConversionForm,
  buildProviderCredentialWizardSteps,
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
        webhookSecret: "email-hook",
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
      escalationRules: [{ label: "Pricing", keywords: ["discount", "refund"], enabled: true }],
    }),
    {
      senderName: "Mazex",
      senderEmail: "hello@mazex.com",
      postalAddress: "Arusha",
      unsubscribeBaseUrl: "https://mazex.test/unsubscribe",
      emailWebhookSecret: "email-hook",
      whatsappBusinessAccountId: "waba",
      whatsappPhoneNumberId: "phone",
      whatsappTemplateName: "intro",
      whatsappWebhookVerifyToken: "verify",
      facebookPageId: "page",
      instagramBusinessAccountId: "ig",
      maxEmailPerHour: "25",
      maxWhatsAppPerHour: "10",
      maxSocialPostsPerDay: "3",
      escalationKeywords: "discount, refund",
      lowConfidenceThreshold: "0.65",
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

test("buildProviderCredentialWizardSteps exposes webhook and env setup guidance", () => {
  const steps = buildProviderCredentialWizardSteps({
    baseUrl: "https://mazexpeditions.vercel.app",
    readiness: { checks: [{ channel: "email", ready: false, missing: ["email provider credentials"] }] },
  });

  assert.equal(steps[0].label, "AI generation");
  assert.equal(steps.some((step) => step.webhookUrl === "https://mazexpeditions.vercel.app/api/platform-admin/outreach/webhooks/email"), true);
  assert.equal(steps.some((step) => step.webhookUrl === "https://mazexpeditions.vercel.app/api/platform-admin/outreach/webhooks/whatsapp"), true);
});

test("buildDefaultThreadConversionForm starts with demo attribution defaults", () => {
  assert.deepEqual(buildDefaultThreadConversionForm(), {
    stage: "demo_booked",
    revenueAmount: "",
    currency: "USD",
    notes: "",
  });
});
