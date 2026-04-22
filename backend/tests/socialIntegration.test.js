import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import SocialAccount from "../models/SocialAccount.js";
import {
  buildFacebookPostPayload,
  buildInstagramMediaPayload,
  buildWhatsAppTextPayload,
} from "../utils/metaGraphApi.js";

test("SocialAccount validation requires tenant-scoped provider config", () => {
  const account = new SocialAccount({
    tenantId: new mongoose.Types.ObjectId(),
    provider: "meta",
    label: "Main Meta",
    accessToken: "token",
    status: "active",
  });

  const validationError = account.validateSync();

  assert.ok(validationError);
  assert.ok(validationError.errors.pageId);
});

test("buildFacebookPostPayload maps caption and image url", () => {
  const payload = buildFacebookPostPayload({
    caption: "Explore the Serengeti",
    imageUrl: "https://example.com/serengeti.jpg",
  });

  assert.equal(payload.message, "Explore the Serengeti");
  assert.equal(payload.url, "https://example.com/serengeti.jpg");
});

test("buildInstagramMediaPayload maps image url and caption", () => {
  const payload = buildInstagramMediaPayload({
    caption: "Witness the migration",
    imageUrl: "https://example.com/migration.jpg",
  });

  assert.equal(payload.caption, "Witness the migration");
  assert.equal(payload.image_url, "https://example.com/migration.jpg");
});

test("buildWhatsAppTextPayload maps destination lead message", () => {
  const payload = buildWhatsAppTextPayload({
    phone: "+255710887798",
    message: "Your safari quote is ready.",
  });

  assert.equal(payload.messaging_product, "whatsapp");
  assert.equal(payload.to, "255710887798");
  assert.equal(payload.text.body, "Your safari quote is ready.");
});
