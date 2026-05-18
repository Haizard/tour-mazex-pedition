import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeReusableSectionTemplatePayload,
  serializeReusableSectionTemplate,
} from "../utils/templateStudioReusableSections.js";

test("normalizeReusableSectionTemplatePayload defaults tenant-scoped saves when a tenant context exists", () => {
  const payload = normalizeReusableSectionTemplatePayload({
    tenantId: "64f0f0f0f0f0f0f0f0f0f0f0",
    section: {
      id: "section-hero",
      type: "hero",
      label: "Hero",
      sourceType: "imported",
      content: { title: "About our safaris" },
      styles: { accentColor: "#0f766e" },
      bindings: [{ sourceKey: "tourPackages", bindingType: "dynamic-collection" }],
    },
    name: "About Hero",
    category: "About",
  });

  assert.equal(payload.tenantId, "64f0f0f0f0f0f0f0f0f0f0f0");
  assert.equal(payload.name, "About Hero");
  assert.equal(payload.sectionType, "hero");
  assert.deepEqual(payload.supportedBindings, ["tourPackages"]);
});

test("normalizeReusableSectionTemplatePayload can publish a platform-wide section", () => {
  const payload = normalizeReusableSectionTemplatePayload({
    tenantId: "64f0f0f0f0f0f0f0f0f0f0f0",
    scope: "platform",
    section: {
      type: "faq",
      label: "FAQ",
      content: { title: "Frequently asked questions" },
    },
    tags: [" trust ", "faq", "trust"],
  });

  assert.equal(payload.tenantId, null);
  assert.deepEqual(payload.tags, ["trust", "faq"]);
  assert.equal(payload.sourceType, "manual");
});

test("serializeReusableSectionTemplate returns a studio-friendly library record", () => {
  const serialized = serializeReusableSectionTemplate({
    _id: { toString: () => "section-db-id" },
    tenantId: null,
    name: "Review Wall",
    category: "Social Proof",
    previewImage: "https://example.com/reviews.jpg",
    sectionType: "reviewWall",
    sourceType: "reusable",
    defaultContent: { title: "Loved by travelers" },
    defaultStyles: { backgroundColor: "#f8fafc" },
    supportedBindings: ["testimonials"],
    sourceMeta: { importJobId: "import_123" },
    tags: ["reviews"],
  });

  assert.equal(serialized.id, "section-db-id");
  assert.equal(serialized.label, "Review Wall");
  assert.equal(serialized.scope, "platform");
  assert.equal(serialized.bindings[0].sourceKey, "testimonials");
});
