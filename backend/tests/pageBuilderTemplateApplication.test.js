import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTemplatePageConfigPayload,
  resolveTemplateForTenant,
} from "../utils/pageBuilderTemplateApplication.js";

test("resolveTemplateForTenant upgrades purchased tenant templates", () => {
  const template = resolveTemplateForTenant({
    templateId: "island-escape-landing",
    tenant: { purchasedTemplates: ["island-escape-landing"] },
  });

  assert.equal(template.id, "island-escape-landing");
  assert.equal(template.purchaseStatus, "purchased");
});

test("buildTemplatePageConfigPayload creates a tenant-owned draft page", () => {
  const payload = buildTemplatePageConfigPayload({
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

test("buildTemplatePageConfigPayload blocks templates the tenant has not purchased", () => {
  assert.throws(
    () =>
      buildTemplatePageConfigPayload({
        templateId: "island-escape-landing",
        tenant: { _id: "64f0f0f0f0f0f0f0f0f0f0f0", name: "Kili Trails" },
      }),
    /not purchased/
  );
});
