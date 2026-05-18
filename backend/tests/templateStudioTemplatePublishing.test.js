import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReusableSectionTemplatePayload,
  buildStudioTemplatePayload,
} from "../utils/templateStudioTemplatePublishing.js";

test("buildReusableSectionTemplatePayload creates a reusable section record from a studio section", () => {
  const payload = buildReusableSectionTemplatePayload({
    section: {
      id: "section-faq",
      type: "faq",
      label: "FAQ",
      sourceType: "imported",
      content: { title: "Frequently asked questions" },
      styles: { backgroundColor: "#f8fafc" },
      bindings: [{ sourceKey: "faqs", bindingType: "dynamic-collection" }],
    },
    name: "FAQ Strip",
    category: "Trust",
  });

  assert.equal(payload.name, "FAQ Strip");
  assert.equal(payload.section.type, "faq");
  assert.equal(payload.supportedBindings[0], "faqs");
});

test("buildStudioTemplatePayload creates a platform template payload from a studio page", () => {
  const payload = buildStudioTemplatePayload({
    studioPage: {
      pageType: "landing",
      slug: "/about",
      title: "About Us",
      seo: { title: "About Us" },
      themeTokens: { accentColor: "#0f766e" },
      sections: [
        {
          id: "hero-1",
          type: "hero",
          label: "Hero",
          order: 1,
          enabled: true,
          sourceType: "manual",
          content: { title: "About our team" },
          styles: { accentColor: "#0f766e" },
          bindings: [],
        },
      ],
    },
    templateMeta: {
      name: "About Us Storytelling",
      category: "About Pages",
      preview: "A team storytelling page for safari operators.",
      previewImage: "https://example.com/about.jpg",
    },
  });

  assert.equal(payload.id, "about-us-storytelling");
  assert.equal(payload.pageType, "landing");
  assert.equal(payload.sections[0].contentConfig.title, "About our team");
  assert.equal(payload.themeTokens.accentColor, "#0f766e");
});
