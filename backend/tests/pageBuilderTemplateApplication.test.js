import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTemplatePageConfigPayload,
  resolveTemplateForTenant,
} from "../utils/pageBuilderTemplateApplication.js";

test("resolveTemplateForTenant upgrades purchased tenant templates", async () => {
  const template = await resolveTemplateForTenant({
    templateId: "island-escape-landing",
    tenant: { purchasedTemplates: ["island-escape-landing"] },
  });

  assert.equal(template.id, "island-escape-landing");
  assert.equal(template.purchaseStatus, "purchased");
});

test("buildTemplatePageConfigPayload creates a tenant-owned draft page", async () => {
  const payload = await buildTemplatePageConfigPayload({
    templateId: "safari-signature-home",
    tenant: {
      _id: "64f0f0f0f0f0f0f0f0f0f0f0",
      name: "Kili Trails",
      purchasedTemplates: ["safari-signature-home"],
    },
  });

  assert.equal(payload.tenantId, "64f0f0f0f0f0f0f0f0f0f0f0");
  assert.equal(payload.pageType, "home");
  assert.equal(payload.status, "draft");
  assert.equal(payload.templateSource.templateId, "safari-signature-home");
  assert.match(payload.sections[0].contentConfig.description, /Kili Trails/);
});

test("buildTemplatePageConfigPayload blocks templates the tenant has not purchased", async () => {
  await assert.rejects(
    () =>
      buildTemplatePageConfigPayload({
        templateId: "island-escape-landing",
        tenant: { _id: "64f0f0f0f0f0f0f0f0f0f0f0", name: "Kili Trails" },
      }),
    /not purchased/
  );
});

test("buildTemplatePageConfigPayload applies purchased platform-created templates", async () => {
  const payload = await buildTemplatePageConfigPayload({
    templateId: "luxury-migration-campaign",
    tenant: {
      _id: "64f0f0f0f0f0f0f0f0f0f0f0",
      name: "Migration Experts",
      purchasedTemplates: ["luxury-migration-campaign"],
    },
    customTemplates: [
      {
        id: "luxury-migration-campaign",
        name: "Luxury Migration Campaign",
        category: "Safari Campaign",
        pageType: "landing",
        priceLabel: "$299",
        purchaseStatus: "available",
        preview: "A seasonal wildebeest migration campaign page.",
        bestFor: ["Migration offers"],
        seo: {},
        sections: [
          {
            type: "hero",
            variant: "cinematic",
            order: 1,
            enabled: true,
            contentConfig: { description: "Launch a premium campaign." },
          },
        ],
      },
    ],
  });

  assert.equal(payload.pageType, "landing");
  assert.equal(payload.templateSource.templateId, "luxury-migration-campaign");
  assert.match(payload.sections[0].contentConfig.description, /Migration Experts/);
});
