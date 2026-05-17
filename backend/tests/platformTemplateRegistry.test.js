import test from "node:test";
import assert from "node:assert/strict";

import {
  mergeTemplateCatalog,
  normalizePlatformTemplatePayload,
} from "../utils/platformTemplateRegistry.js";

test("normalizePlatformTemplatePayload creates a published page-builder template", () => {
  const template = normalizePlatformTemplatePayload({
    name: "Luxury Migration Campaign",
    category: "Safari Campaign",
    pageType: "landing",
    priceLabel: "$299",
    previewImage: "https://example.com/template.jpg",
    preview: "A seasonal wildebeest migration campaign page.",
    bestFor: "Migration offers\nPrivate safaris",
    sectionsJson: JSON.stringify([
      {
        type: "hero",
        variant: "cinematic",
        order: 2,
        enabled: true,
        contentConfig: { description: "Launch a premium campaign." },
      },
    ]),
  });

  assert.equal(template.id, "luxury-migration-campaign");
  assert.equal(template.status, "published");
  assert.equal(template.purchaseStatus, "available");
  assert.deepEqual(template.bestFor, ["Migration offers", "Private safaris"]);
  assert.equal(template.sections[0].order, 1);
});

test("mergeTemplateCatalog lets platform templates override by id", () => {
  const catalog = mergeTemplateCatalog(
    [{ id: "starter", name: "Starter", source: "built-in" }],
    [{ id: "starter", name: "Platform Starter", source: "platform" }]
  );

  assert.deepEqual(catalog, [{ id: "starter", name: "Platform Starter", source: "platform" }]);
});
