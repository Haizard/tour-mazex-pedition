import test from "node:test";
import assert from "node:assert/strict";

import { buildChatVisitorProfile } from "./chatAttribution.js";

test("buildChatVisitorProfile captures campaign and source context from marketplace URLs", () => {
  const profile = buildChatVisitorProfile({
    navigatorLanguage: "en-US",
    timezone: "Africa/Nairobi",
    locationLike: {
      pathname: "/discover/tours/serengeti-migration",
      search: "?utm_campaign=july-safaris&utm_source=instagram",
      href: "https://mazexpeditions.vercel.app/discover/tours/serengeti-migration?utm_campaign=july-safaris&utm_source=instagram",
    },
    referrer: "https://instagram.com/safari-story",
  });

  assert.equal(profile.preferredLocale, "en-US");
  assert.equal(profile.currentPage, "/discover/tours/serengeti-migration");
  assert.equal(profile.campaignLabel, "july-safaris");
  assert.equal(profile.sourceHint, "instagram");
  assert.equal(profile.referrerHost, "instagram.com");
});

test("buildChatVisitorProfile falls back to tenant website context when no campaign is present", () => {
  const profile = buildChatVisitorProfile({
    navigatorLanguage: "fr-FR",
    timezone: "Europe/Paris",
    locationLike: {
      pathname: "/demo/mazepro/packages/serengeti-migration",
      search: "",
      href: "https://mazexpeditions.vercel.app/demo/mazepro/packages/serengeti-migration",
    },
    referrer: "",
  });

  assert.equal(profile.campaignLabel, "");
  assert.equal(profile.sourceHint, "tenant-website");
  assert.equal(profile.referrerHost, "");
});

