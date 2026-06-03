import test from "node:test";
import assert from "node:assert/strict";
import PlatformOutreachCampaign from "../models/PlatformOutreachCampaign.js";
import PlatformOutreachMessage from "../models/PlatformOutreachMessage.js";
import PlatformSocialPost from "../models/PlatformSocialPost.js";
import PlatformOutreachSettings from "../models/PlatformOutreachSettings.js";
import PlatformOutreachThread from "../models/PlatformOutreachThread.js";

test("platform outreach campaign requires at least one channel", async () => {
  const campaign = new PlatformOutreachCampaign({
    title: "Tour operator launch",
    objective: "Invite operators to join Mazex",
    channels: [],
  });

  await assert.rejects(() => campaign.validate(), /At least one outreach channel/i);
});

test("platform outreach message supports queued outbound email", async () => {
  const message = new PlatformOutreachMessage({
    channel: "email",
    direction: "outbound",
    subject: "Grow direct safari leads",
    body: "Mazex helps tour operators modernize sales.",
    status: "queued",
  });

  await assert.doesNotReject(() => message.validate());
});

test("platform social post requires at least one platform", async () => {
  const post = new PlatformSocialPost({
    title: "Platform launch",
    platforms: [],
    caption: "Join Mazex.",
  });

  await assert.rejects(() => post.validate(), /At least one social platform/i);
});

test("platform outreach settings support escalation rules and email webhook setup", async () => {
  const settings = new PlatformOutreachSettings({
    email: { webhookSecret: "email-hook" },
    escalationRules: [{ label: "Pricing", keywords: ["discount"], enabled: true }],
  });

  await assert.doesNotReject(() => settings.validate());
  assert.equal(settings.escalationRules[0].label, "Pricing");
});

test("platform outreach thread stores conversion attribution", async () => {
  const thread = new PlatformOutreachThread({
    prospectId: "64f000000000000000000001",
    channel: "email",
    participantAddress: "sales@example.com",
    conversionAttribution: {
      stage: "subscription_won",
      revenueAmount: 750,
      currency: "USD",
    },
  });

  await assert.doesNotReject(() => thread.validate());
});
