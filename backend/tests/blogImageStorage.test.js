import test from "node:test";
import assert from "node:assert/strict";

import { resolveBlogImageAsset } from "../controllers/blogController.js";

test("resolveBlogImageAsset keeps normal image urls unchanged", async () => {
  const result = await resolveBlogImageAsset({
    image: "https://cdn.example.com/blog.jpg",
    tenantId: "tenant_1",
    title: "Migration Notes",
  });

  assert.deepEqual(result, {
    image: "https://cdn.example.com/blog.jpg",
    imageMediaId: null,
  });
});

test("resolveBlogImageAsset stores inline blog images through generated media storage", async () => {
  const result = await resolveBlogImageAsset({
    image: "data:image/png;base64,aGVsbG8=",
    tenantId: "tenant_1",
    title: "Migration Notes",
    storeMediaAsset: async () => ({
      url: "/api/media/media_1",
      mediaId: "media_1",
    }),
  });

  assert.deepEqual(result, {
    image: "/api/media/media_1",
    imageMediaId: "media_1",
  });
});
