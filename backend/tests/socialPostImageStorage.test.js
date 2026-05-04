import test from "node:test";
import assert from "node:assert/strict";

import { resolveSocialPostImageAssets } from "../controllers/socialPostController.js";

test("resolveSocialPostImageAssets keeps normal urls unchanged", async () => {
  const result = await resolveSocialPostImageAssets({
    imageUrls: [
      "https://cdn.example.com/serengeti-1.jpg",
      "https://cdn.example.com/serengeti-2.jpg",
    ],
    tenantId: "tenant_1",
    title: "Migration Story",
  });

  assert.deepEqual(result, {
    imageUrls: [
      "https://cdn.example.com/serengeti-1.jpg",
      "https://cdn.example.com/serengeti-2.jpg",
    ],
    imageAssets: [
      {
        url: "https://cdn.example.com/serengeti-1.jpg",
        mediaId: null,
      },
      {
        url: "https://cdn.example.com/serengeti-2.jpg",
        mediaId: null,
      },
    ],
  });
});

test("resolveSocialPostImageAssets stores inline data urls through generated media storage", async () => {
  let storedCount = 0;

  const result = await resolveSocialPostImageAssets({
    imageUrls: [
      "https://cdn.example.com/serengeti-1.jpg",
      "data:image/png;base64,aGVsbG8=",
    ],
    tenantId: "tenant_1",
    title: "Migration Story",
    storeMediaAsset: async ({ filenameBase }) => {
      storedCount += 1;
      assert.match(filenameBase, /^social-post-migration-story-image-2$/);
      return {
        url: "/api/media/media_2",
        mediaId: "media_2",
      };
    },
  });

  assert.equal(storedCount, 1);
  assert.deepEqual(result, {
    imageUrls: [
      "https://cdn.example.com/serengeti-1.jpg",
      "/api/media/media_2",
    ],
    imageAssets: [
      {
        url: "https://cdn.example.com/serengeti-1.jpg",
        mediaId: null,
      },
      {
        url: "/api/media/media_2",
        mediaId: "media_2",
      },
    ],
  });
});
