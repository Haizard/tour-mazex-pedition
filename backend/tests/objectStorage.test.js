import { Buffer } from "node:buffer";
import test from "node:test";
import assert from "node:assert/strict";

import {
  assertMediaUploadAllowed,
  buildMediaResponsePayload,
  buildStoredMediaReadPlan,
  createObjectStorageClient,
  getObjectStorageStrategy,
  persistMediaAsset,
  resolveStoredMediaReadPlan,
  uploadStoredMediaAsset,
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

test("createObjectStorageClient normalizes legacy AWS bucket endpoints to the configured regional endpoint", () => {
  const strategy = getObjectStorageStrategy({
    MEDIA_STORAGE_PROVIDER: "s3-compatible",
    S3_BUCKET: "maz-expeditions-assets",
    S3_ENDPOINT: "https://maz-expeditions-assets.s3.amazonaws.com",
    S3_REGION: "eu-west-1",
    S3_ACCESS_KEY_ID: "key",
    S3_SECRET_ACCESS_KEY: "secret",
  });

  const client = createObjectStorageClient(strategy);
  assert.equal(strategy.endpoint, "https://s3.eu-west-1.amazonaws.com");
  assert.equal(Boolean(client), true);
});

test("assertMediaUploadAllowed only applies the inline size limit to mongo-inline storage", () => {
  const bigBuffer = Buffer.alloc(16 * 1024 * 1024, 1);

  assert.throws(
    () =>
      assertMediaUploadAllowed({
        buffer: bigBuffer,
        strategy: getObjectStorageStrategy({ MEDIA_STORAGE_PROVIDER: "mongo-inline" }),
      }),
    /15MB/
  );

  assert.doesNotThrow(() =>
    assertMediaUploadAllowed({
      buffer: bigBuffer,
      strategy: getObjectStorageStrategy({
        MEDIA_STORAGE_PROVIDER: "s3-compatible",
        S3_BUCKET: "mazex-media",
        S3_ENDPOINT: "https://s3.example.com",
      }),
    })
  );
});

test("uploadStoredMediaAsset sends bytes to the s3-compatible client", async () => {
  const sentCommands = [];
  const s3Client = {
    send: async (command) => {
      sentCommands.push(command);
      return { ETag: '"etag-1"' };
    },
  };

  const asset = await uploadStoredMediaAsset({
    filename: "hero.jpg",
    contentType: "image/jpeg",
    buffer: Buffer.from("hello"),
    tenantId: "tenant-2",
    strategy: getObjectStorageStrategy({
      MEDIA_STORAGE_PROVIDER: "s3-compatible",
      S3_BUCKET: "mazex-media",
      S3_ENDPOINT: "https://s3.example.com",
      S3_PUBLIC_BASE_URL: "https://cdn.example.com",
    }),
    s3Client,
  });

  assert.equal(asset.storageProvider, "s3-compatible");
  assert.equal(asset.inlineData, null);
  assert.equal(sentCommands.length, 1);
  assert.equal(sentCommands[0].input.Bucket, "mazex-media");
  assert.equal(sentCommands[0].input.ContentType, "image/jpeg");
});

test("buildStoredMediaReadPlan returns a redirect plan for object storage media", () => {
  const plan = buildStoredMediaReadPlan({
    storageProvider: "s3-compatible",
    publicUrl: "https://cdn.example.com/file.jpg",
  });

  assert.equal(plan.mode, "redirect");
  assert.equal(plan.redirectUrl, "https://cdn.example.com/file.jpg");
});

test("resolveStoredMediaReadPlan falls back to a signed redirect when no public url exists", async () => {
  const plan = await resolveStoredMediaReadPlan({
    media: {
      storageProvider: "s3-compatible",
      storageBucket: "mazex-media",
      storageKey: "tenant-1/hero.jpg",
      publicUrl: "",
    },
    strategy: getObjectStorageStrategy({
      MEDIA_STORAGE_PROVIDER: "s3-compatible",
      S3_BUCKET: "mazex-media",
      S3_ENDPOINT: "https://s3.example.com",
      S3_SIGNED_URL_TTL_SECONDS: "600",
    }),
    signUrl: async (_client, command, options) =>
      `https://signed.example.com/${command.input.Key}?ttl=${options.expiresIn}`,
    s3Client: { send: async () => ({}) },
  });

  assert.equal(plan.mode, "redirect");
  assert.equal(plan.redirectUrl, "https://signed.example.com/tenant-1/hero.jpg?ttl=600");
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
