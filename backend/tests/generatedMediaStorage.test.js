import { Buffer } from "node:buffer";
import test from "node:test";
import assert from "node:assert/strict";

import {
  parseInlineDataUrl,
  storeGeneratedMediaAsset,
} from "../utils/generatedMediaStorage.js";

test("parseInlineDataUrl extracts mime type and bytes from data urls", () => {
  const parsed = parseInlineDataUrl("data:image/png;base64,aGVsbG8=");

  assert.equal(parsed.contentType, "image/png");
  assert.equal(parsed.buffer.toString("utf8"), "hello");
});

test("storeGeneratedMediaAsset returns api media urls for mongo-inline assets", async () => {
  const saved = [];

  class FakeMedia {
    constructor(payload) {
      Object.assign(this, payload, { _id: "media_1" });
    }

    async save() {
      saved.push(this);
    }

    toObject() {
      return { ...this };
    }
  }

  const result = await storeGeneratedMediaAsset({
    tenantId: "tenant_1",
    filenameBase: "daily-blog-hero",
    dataUrl: "data:image/png;base64,aGVsbG8=",
    strategy: {
      activeProvider: "mongo-inline",
      allowedMimePrefixes: ["image/"],
    },
    MediaModel: FakeMedia,
    syncMediaViews: async () => {},
    uploadAsset: async () => ({
      inlineData: Buffer.from("hello"),
      size: 5,
      storageProvider: "mongo-inline",
      storageKey: "",
      storageBucket: "",
      storageEndpoint: "",
      publicUrl: "",
    }),
  });

  assert.equal(saved.length, 1);
  assert.equal(result.mediaId, "media_1");
  assert.equal(result.url, "/api/media/media_1");
  assert.equal(result.storageProvider, "mongo-inline");
});

test("storeGeneratedMediaAsset preserves public urls for s3-compatible assets", async () => {
  class FakeMedia {
    constructor(payload) {
      Object.assign(this, payload, { _id: "media_2" });
    }

    async save() {}

    toObject() {
      return { ...this };
    }
  }

  const result = await storeGeneratedMediaAsset({
    tenantId: "tenant_2",
    filenameBase: "daily-blog-hero",
    dataUrl: "data:image/png;base64,aGVsbG8=",
    strategy: {
      activeProvider: "s3-compatible",
      allowedMimePrefixes: ["image/"],
    },
    MediaModel: FakeMedia,
    syncMediaViews: async () => {},
    uploadAsset: async () => ({
      inlineData: null,
      size: 5,
      storageProvider: "s3-compatible",
      storageKey: "tenant_2/file.png",
      storageBucket: "mazex-media",
      storageEndpoint: "https://s3.example.com",
      publicUrl: "https://cdn.example.com/tenant_2/file.png",
    }),
  });

  assert.equal(result.mediaId, "media_2");
  assert.equal(result.url, "https://cdn.example.com/tenant_2/file.png");
  assert.equal(result.storageProvider, "s3-compatible");
});
