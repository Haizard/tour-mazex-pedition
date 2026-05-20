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
      assignmentId: "assignment-1",
      masterTemplateId: "safari-signature-home",
      personalizationMode: "assignment",
      personalizedFor: "Kili Trails",
      personalizationNote: "Adjusted copy and color.",
    },
    templateStudio: {
      sourceMeta: {
        assignmentId: "assignment-1",
        masterTemplateId: "safari-signature-home",
        personalizationLayerId: "personalization-home-1",
      },
    },
  });

  const serialized = page.toObject();

  assert.equal(serialized.templateSource.templateId, "safari-signature-home");
  assert.equal(serialized.templateSource.assignmentId, "assignment-1");
  assert.equal(serialized.templateSource.personalizedFor, "Kili Trails");
  assert.equal(serialized.templateStudio.sourceMeta.personalizationLayerId, "personalization-home-1");
});
