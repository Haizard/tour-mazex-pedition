import test from "node:test";
import assert from "node:assert/strict";

import {
  platformOutreachApiPaths,
  buildPlatformOutreachProspectsParams,
} from "./platformOutreachApiPaths.js";

test("platform outreach API paths point at the platform-admin outreach namespace", () => {
  assert.equal(platformOutreachApiPaths.readiness(), "/platform-admin/outreach/settings/readiness");
  assert.equal(platformOutreachApiPaths.prospects(), "/platform-admin/outreach/prospects");
  assert.equal(platformOutreachApiPaths.prospect("abc123"), "/platform-admin/outreach/prospects/abc123");
  assert.equal(platformOutreachApiPaths.prospectImport(), "/platform-admin/outreach/prospects/import");
  assert.equal(platformOutreachApiPaths.campaigns(), "/platform-admin/outreach/campaigns");
  assert.equal(platformOutreachApiPaths.generateCampaignMessage("camp1"), "/platform-admin/outreach/campaigns/camp1/generate");
  assert.equal(platformOutreachApiPaths.launchCampaign("camp1"), "/platform-admin/outreach/campaigns/camp1/launch");
  assert.equal(platformOutreachApiPaths.messages(), "/platform-admin/outreach/messages");
  assert.equal(platformOutreachApiPaths.socialPosts(), "/platform-admin/outreach/social-posts");
  assert.equal(platformOutreachApiPaths.socialPost("post1"), "/platform-admin/outreach/social-posts/post1");
});

test("platform outreach prospect params omit blank status filters", () => {
  assert.deepEqual(buildPlatformOutreachProspectsParams({ status: "" }), {});
  assert.deepEqual(buildPlatformOutreachProspectsParams({ status: "qualified" }), { status: "qualified" });
});
