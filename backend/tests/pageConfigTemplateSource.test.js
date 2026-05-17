import test from "node:test";
import assert from "node:assert/strict";

import PageConfig from "../models/PageConfig.js";

test("PageConfig stores template marketplace source metadata", () => {
  const page = new PageConfig({
    tenantId: "64f0f0f0f0f0f0f0f0f0f0f0",
    pageType: "home",
    slug: "/",
    title: "Home",
    templateSource: {
      templateId: "safari-signature-home",
      templateName: "Safari Signature Home",
      personalizedFor: "Kili Trails",
      personalizationNote: "Adjusted copy and color.",
    },
  });

  const serialized = page.toObject();

  assert.equal(serialized.templateSource.templateId, "safari-signature-home");
  assert.equal(serialized.templateSource.personalizedFor, "Kili Trails");
});
