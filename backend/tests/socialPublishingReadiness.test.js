import test from "node:test";
import assert from "node:assert/strict";

import { resolveSocialPublishingReadiness } from "../utils/socialPublishingReadiness.js";

test("resolveSocialPublishingReadiness returns the freshest active Meta account for Facebook publishing", () => {
  const readiness = resolveSocialPublishingReadiness({
    accounts: [
      {
        provider: "meta",
        status: "active",
        pageId: "page_old",
        lastVerifiedAt: "2026-05-10T00:00:00.000Z",
      },
      {
        provider: "meta",
        status: "active",
        pageId: "page_new",
        lastVerifiedAt: "2026-05-12T00:00:00.000Z",
      },
    ],
    platforms: ["facebook"],
  });

  assert.equal(readiness.ready, true);
  assert.equal(readiness.account.pageId, "page_new");
});

test("resolveSocialPublishingReadiness explains when only WhatsApp is connected", () => {
  const readiness = resolveSocialPublishingReadiness({
    accounts: [
      {
        provider: "whatsapp",
        status: "active",
        whatsappPhoneNumberId: "phone_1",
      },
    ],
    platforms: ["instagram"],
  });

  assert.equal(readiness.ready, false);
  assert.match(readiness.message, /WhatsApp is connected/i);
});

test("resolveSocialPublishingReadiness requires Instagram business id for Instagram posts", () => {
  const readiness = resolveSocialPublishingReadiness({
    accounts: [
      {
        provider: "meta",
        status: "active",
        pageId: "page_1",
        instagramBusinessAccountId: "",
      },
    ],
    platforms: ["instagram"],
  });

  assert.equal(readiness.ready, false);
  assert.match(readiness.message, /Instagram Business Account ID/i);
});
