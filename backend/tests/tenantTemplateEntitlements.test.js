import test from "node:test";
import assert from "node:assert/strict";

import Tenant from "../models/Tenant.js";

test("Tenant stores purchased page-builder template entitlements", () => {
  const tenant = new Tenant({
    name: "Kili Trails",
    slug: "kili-trails",
    purchasedTemplates: ["island-escape-landing", "safari-signature-home"],
  });

  const serialized = tenant.toObject();

  assert.deepEqual(serialized.purchasedTemplates, [
    "island-escape-landing",
    "safari-signature-home",
  ]);
});
