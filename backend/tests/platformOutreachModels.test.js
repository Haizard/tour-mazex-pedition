import test from "node:test";
import assert from "node:assert/strict";
import PlatformOutreachCampaign from "../models/PlatformOutreachCampaign.js";
import PlatformOutreachMessage from "../models/PlatformOutreachMessage.js";
import PlatformSocialPost from "../models/PlatformSocialPost.js";

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
