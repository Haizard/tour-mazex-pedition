import test from "node:test";
import assert from "node:assert/strict";

import Tenant from "../models/Tenant.js";
import {
  buildRequestedTemplateList,
  getTemplateRequestStatus,
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
