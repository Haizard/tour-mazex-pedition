import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCanonicalLegacySiteSettingsPayload,
  buildLegacySiteSettingsUpsertUpdate,
} from "../utils/tenantBootstrap.js";

test("buildCanonicalLegacySiteSettingsPayload keeps the newest non-empty legacy site settings values", () => {
  const payload = buildCanonicalLegacySiteSettingsPayload([
    {
      facebook: "",
      twitter: "",
      instagram: "https://instagram.com/newest",
      whatsapp: "",
      updatedAt: new Date("2026-05-05T11:00:00.000Z"),
    },
    {
      facebook: "https://facebook.com/legacy",
      twitter: "https://twitter.com/legacy",
      instagram: "",
      whatsapp: "+255700000000",
      youtube: "https://youtube.com/legacy",
      updatedAt: new Date("2026-05-04T11:00:00.000Z"),
    },
  ]);

  assert.deepEqual(payload, {
    facebook: "https://facebook.com/legacy",
    twitter: "https://twitter.com/legacy",
    instagram: "https://instagram.com/newest",
    whatsapp: "+255700000000",
    youtube: "https://youtube.com/legacy",
    reddit: "",
    logoUrl: "",
  });
});

test("buildCanonicalLegacySiteSettingsPayload falls back to empty defaults", () => {
  assert.deepEqual(buildCanonicalLegacySiteSettingsPayload([]), {
    facebook: "",
    twitter: "",
    instagram: "",
    whatsapp: "",
    youtube: "",
    reddit: "",
    logoUrl: "",
  });
});

test("buildLegacySiteSettingsUpsertUpdate avoids duplicate tenantId operators", () => {
  const tenantId = "tenant-123";
  const canonicalPayload = {
    facebook: "https://facebook.com/legacy",
    twitter: "",
    instagram: "",
    whatsapp: "",
    youtube: "",
    reddit: "",
    logoUrl: "",
  };

  const update = buildLegacySiteSettingsUpsertUpdate(tenantId, canonicalPayload);

  assert.equal(update.$set.tenantId, undefined);
  assert.equal(update.$setOnInsert.tenantId, tenantId);
  assert.equal(update.$set.facebook, "https://facebook.com/legacy");
});
