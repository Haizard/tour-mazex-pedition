import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDeterministicTemplateDraft,
  buildPlatformTemplateAiPrompt,
  parseTemplateBuilderResponse,
} from "../utils/platformTemplateAiBuilder.js";

test("buildPlatformTemplateAiPrompt asks for page-builder template JSON", () => {
  const prompt = buildPlatformTemplateAiPrompt({
    concept: "luxury migration safari",
    audience: "premium safari planners",
  });

  assert.match(prompt, /reusable tourism website template/);
  assert.match(prompt, /luxury migration safari/);
  assert.match(prompt, /"template"/);
});

test("buildDeterministicTemplateDraft creates editable page-builder sections", () => {
  const draft = buildDeterministicTemplateDraft({
    concept: "luxury migration safari",
    audience: "premium safari planners",
    destination: "Serengeti",
  });

  assert.equal(draft.name, "Luxury Migration Safari Template");
  assert.equal(draft.status, "draft");
  assert.ok(draft.sections.length >= 3);
  assert.equal(draft.sections[0].type, "hero");
});

test("parseTemplateBuilderResponse normalizes AI template output", () => {
  const draft = parseTemplateBuilderResponse(JSON.stringify({
    template: {
      name: "Coastal Honeymoon",
      category: "Beach Escape",
      sections: [
        {
          type: "hero",
          contentConfig: { headlineScript: "Zanzibar Honeymoon" },
        },
      ],
    },
  }));

  assert.equal(draft.id, "platform-coastal-honeymoon");
  assert.equal(draft.category, "Beach Escape");
  assert.equal(draft.sections[0].order, 1);
});
