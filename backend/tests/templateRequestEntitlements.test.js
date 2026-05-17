import test from "node:test";
import assert from "node:assert/strict";

import Tenant from "../models/Tenant.js";
import {
  buildRequestedTemplateList,
  getTemplateRequestStatus,
  summarizeTemplateRequests,
} from "../utils/templateRequests.js";

test("Tenant stores requested template opt-ins", () => {
  const tenant = new Tenant({
    name: "Kili Trails",
    slug: "kili-trails",
    requestedTemplates: ["island-escape-landing"],
  });

  assert.deepEqual(tenant.toObject().requestedTemplates, ["island-escape-landing"]);
});

test("buildRequestedTemplateList adds one request without duplicates", () => {
  const requested = buildRequestedTemplateList(["island-escape-landing"], "island-escape-landing");

  assert.deepEqual(requested, ["island-escape-landing"]);
});

test("getTemplateRequestStatus distinguishes purchased and requested templates", () => {
  assert.equal(
    getTemplateRequestStatus({
      templateId: "island-escape-landing",
      tenant: { purchasedTemplates: ["island-escape-landing"], requestedTemplates: [] },
    }),
    "purchased"
  );
  assert.equal(
    getTemplateRequestStatus({
      templateId: "island-escape-landing",
      tenant: { purchasedTemplates: [], requestedTemplates: ["island-escape-landing"] },
    }),
    "requested"
  );
  assert.equal(
    getTemplateRequestStatus({
      templateId: "island-escape-landing",
      tenant: { purchasedTemplates: [], requestedTemplates: [] },
    }),
    "available"
  );
});

test("summarizeTemplateRequests creates an admin queue from tenants", () => {
  const queue = summarizeTemplateRequests([
    {
      _id: "tenant-1",
      name: "Kili Trails",
      slug: "kili-trails",
      requestedTemplates: ["island-escape-landing"],
      purchasedTemplates: [],
    },
    {
      _id: "tenant-2",
      name: "Safari Co",
      slug: "safari-co",
      requestedTemplates: ["island-escape-landing", "safari-signature-home"],
      purchasedTemplates: ["safari-signature-home"],
    },
  ]);

  assert.equal(queue.length, 2);
  assert.deepEqual(queue[0], {
    tenantId: "tenant-1",
    tenantName: "Kili Trails",
    tenantSlug: "kili-trails",
    templateId: "island-escape-landing",
  });
});
