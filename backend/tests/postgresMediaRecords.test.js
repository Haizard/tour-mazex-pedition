import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMediaAssetLookup,
  buildMediaAssetUpsert,
  buildMediaAssetView,
} from "../utils/postgresMediaRecords.js";

test("buildMediaAssetUpsert targets media_asset_records", () => {
  const statement = buildMediaAssetUpsert({
    _id: "media-1",
    tenantId: "tenant-1",
    filename: "hero.jpg",
    storageProvider: "mongo-inline",
    size: 2048,
  });

  assert.equal(statement.text.includes("media_asset_records"), true);
  assert.equal(statement.values[0], "media-1");
  assert.equal(statement.values[2], "hero.jpg");
});

test("buildMediaAssetLookup targets one media asset record", () => {
  const statement = buildMediaAssetLookup("media-1", "tenant-1");

  assert.equal(statement.text.includes("media_asset_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["media-1", "tenant-1"]);
});

test("buildMediaAssetView reconstructs the media payload", () => {
  const media = buildMediaAssetView({
    source_id: "media-1",
    tenant_id: "tenant-1",
    filename: "hero.jpg",
    content_type: "image/jpeg",
    size: 2048,
    storage_provider: "mongo-inline",
    storage_key: "",
    storage_bucket: "",
    storage_endpoint: "",
    public_url: "https://example.com/hero.jpg",
    uploaded_by: "admin-1",
  });

  assert.equal(media._id, "media-1");
  assert.equal(media.filename, "hero.jpg");
  assert.equal(media.contentType, "image/jpeg");
  assert.equal(media.publicUrl, "https://example.com/hero.jpg");
});
