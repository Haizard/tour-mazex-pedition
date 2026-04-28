import { Buffer } from "node:buffer";
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMediaResponsePayload,
  buildStoredMediaReadPlan,
  getObjectStorageStrategy,
  persistMediaAsset,
} from "../utils/objectStorage.js";

test("getObjectStorageStrategy falls back to mongo-inline when s3 config is incomplete", () => {
  const strategy = getObjectStorageStrategy({
    MEDIA_STORAGE_PROVIDER: "s3-compatible",
    S3_BUCKET: "",
    S3_ENDPOINT: "",
  });

  assert.equal(strategy.activeProvider, "mongo-inline");
  assert.equal(strategy.reasons.length > 0, true);
});

test("persistMediaAsset keeps inline buffers when mongo-inline storage is active", () => {
  const asset = persistMediaAsset({
    filename: "itinerary.pdf",
    contentType: "application/pdf",
    buffer: Buffer.from("hello"),
    tenantId: "tenant-1",
    strategy: getObjectStorageStrategy({ MEDIA_STORAGE_PROVIDER: "mongo-inline" }),
  });

  assert.equal(asset.storageProvider, "mongo-inline");
  assert.equal(Buffer.isBuffer(asset.inlineData), true);
});

test("persistMediaAsset prepares an object-storage key when s3-compatible storage is active", () => {
  const asset = persistMediaAsset({
    filename: "cover.jpg",
    contentType: "image/jpeg",
    buffer: Buffer.from("hello"),
    tenantId: "tenant-2",
    strategy: getObjectStorageStrategy({
      MEDIA_STORAGE_PROVIDER: "s3-compatible",
      S3_BUCKET: "mazex-media",
      S3_ENDPOINT: "https://s3.example.com",
      S3_PUBLIC_BASE_URL: "https://cdn.example.com",
    }),
  });

  assert.equal(asset.storageProvider, "s3-compatible");
  assert.equal(asset.storageBucket, "mazex-media");
  assert.equal(asset.publicUrl.startsWith("https://cdn.example.com/tenant-2/"), true);
});

test("buildStoredMediaReadPlan returns a redirect plan for object storage media", () => {
  const plan = buildStoredMediaReadPlan({
    storageProvider: "s3-compatible",
    publicUrl: "https://cdn.example.com/file.jpg",
  });

  assert.equal(plan.mode, "redirect");
  assert.equal(plan.redirectUrl, "https://cdn.example.com/file.jpg");
});

test("buildMediaResponsePayload exposes route-friendly media metadata", () => {
  const payload = buildMediaResponsePayload({
    _id: "media-1",
    storageProvider: "mongo-inline",
    size: 128,
    contentType: "image/png",
  });

  assert.equal(payload.url, "/api/media/media-1");
  assert.equal(payload.storageProvider, "mongo-inline");
});
