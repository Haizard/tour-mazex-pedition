import test from "node:test";
import assert from "node:assert/strict";

import {
  platformOutreachApiPaths,
  buildPlatformOutreachProspectsParams,
} from "./platformOutreachApiPaths.js";

test("platform outreach API paths point at the platform-admin outreach namespace", () => {
  assert.equal(platformOutreachApiPaths.readiness(), "/platform-admin/outreach/settings/readiness");
  assert.equal(platformOutreachApiPaths.settings(), "/platform-admin/outreach/settings");
  assert.equal(platformOutreachApiPaths.prospects(), "/platform-admin/outreach/prospects");
  assert.equal(platformOutreachApiPaths.prospect("abc123"), "/platform-admin/outreach/prospects/abc123");
  assert.equal(platformOutreachApiPaths.prospectImport(), "/platform-admin/outreach/prospects/import");
  assert.equal(platformOutreachApiPaths.campaigns(), "/platform-admin/outreach/campaigns");
  assert.equal(platformOutreachApiPaths.generateCampaignMessage("camp1"), "/platform-admin/outreach/campaigns/camp1/generate");
  assert.equal(platformOutreachApiPaths.launchCampaign("camp1"), "/platform-admin/outreach/campaigns/camp1/launch");
  assert.equal(platformOutreachApiPaths.pauseCampaign("camp1"), "/platform-admin/outreach/campaigns/camp1/pause");
  assert.equal(platformOutreachApiPaths.messages(), "/platform-admin/outreach/messages");
  assert.equal(platformOutreachApiPaths.sendMessageNow("msg1"), "/platform-admin/outreach/messages/msg1/send-now");
  assert.equal(platformOutreachApiPaths.analytics(), "/platform-admin/outreach/analytics");
  assert.equal(platformOutreachApiPaths.threads(), "/platform-admin/outreach/threads");
  assert.equal(platformOutreachApiPaths.ingestThreadReply(), "/platform-admin/outreach/threads/ingest-reply");
  assert.equal(platformOutreachApiPaths.agentReply("thread1"), "/platform-admin/outreach/threads/thread1/agent-reply");
  assert.equal(platformOutreachApiPaths.approveAgentReply("thread1"), "/platform-admin/outreach/threads/thread1/approve-agent-reply");
  assert.equal(platformOutreachApiPaths.threadConversion("thread1"), "/platform-admin/outreach/threads/thread1/conversion");
  assert.equal(platformOutreachApiPaths.emailWebhook(), "/platform-admin/outreach/webhooks/email");
  assert.equal(platformOutreachApiPaths.whatsAppWebhook(), "/platform-admin/outreach/webhooks/whatsapp");
  assert.equal(platformOutreachApiPaths.socialPosts(), "/platform-admin/outreach/social-posts");
  assert.equal(platformOutreachApiPaths.socialPost("post1"), "/platform-admin/outreach/social-posts/post1");
  assert.equal(platformOutreachApiPaths.publishSocialPostNow("post1"), "/platform-admin/outreach/social-posts/post1/publish-now");
});

test("platform outreach prospect params omit blank status filters", () => {
  assert.deepEqual(buildPlatformOutreachProspectsParams({ status: "" }), {});
  assert.deepEqual(buildPlatformOutreachProspectsParams({ status: "qualified" }), { status: "qualified" });
});
