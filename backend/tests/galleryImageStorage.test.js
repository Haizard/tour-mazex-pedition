import test from "node:test";
import assert from "node:assert/strict";

import { resolveGalleryImageAsset } from "../controllers/galleryController.js";

test("resolveGalleryImageAsset keeps normal gallery image urls unchanged", async () => {
  const result = await resolveGalleryImageAsset({
    img: "https://cdn.example.com/gallery/lake-manyara.jpg",
    tenantId: "tenant_1",
    location: "Lake Manyara",
  });

  assert.deepEqual(result, {
    img: "https://cdn.example.com/gallery/lake-manyara.jpg",
    imageMediaId: null,
  });
});

test("resolveGalleryImageAsset stores inline gallery images through generated media storage", async () => {
  const result = await resolveGalleryImageAsset({
    img: "data:image/png;base64,aGVsbG8=",
    tenantId: "tenant_1",
    location: "Lake Manyara",
    storeMediaAsset: async ({ filenameBase }) => {
      assert.match(filenameBase, /^gallery-lake-manyara$/);
      return {
        url: "/api/media/media_gallery_1",
        mediaId: "media_gallery_1",
      };
    },
  });

  assert.deepEqual(result, {
    img: "/api/media/media_gallery_1",
    imageMediaId: "media_gallery_1",
  });
});
