import test from "node:test";
import assert from "node:assert/strict";

import {
  canViewUnpublishedPage,
  getDefaultPageSlug,
  isPagePubliclyAccessible,
  normalizePageSlug,
} from "../utils/pagePublishing.js";

test("normalizePageSlug keeps slash formatting stable", () => {
  assert.equal(normalizePageSlug(" safari-pages/ "), "/safari-pages");
  assert.equal(normalizePageSlug("/"), "/");
});

test("getDefaultPageSlug returns root for home and path for other pages", () => {
  assert.equal(getDefaultPageSlug("home"), "/");
  assert.equal(getDefaultPageSlug("contact"), "/contact");
});

test("public requests cannot view draft pages", () => {
  assert.equal(isPagePubliclyAccessible({ status: "draft" }, {}), false);
  assert.equal(isPagePubliclyAccessible({ status: "published" }, {}), true);
});

test("tenant and platform admins can view unpublished pages", () => {
  assert.equal(canViewUnpublishedPage({ admin: { _id: "tenant-admin" } }), true);
  assert.equal(canViewUnpublishedPage({ platformAdmin: { _id: "platform-admin" } }), true);
  assert.equal(isPagePubliclyAccessible({ status: "draft" }, { admin: { _id: "tenant-admin" } }), true);
});
