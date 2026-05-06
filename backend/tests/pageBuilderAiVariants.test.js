import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAiVariantPrompt,
  buildClassicDesignVariants,
  normalizeAiVariantSections,
} from "../utils/pageBuilderAiVariants.js";

const heroSection = {
  type: "hero",
  variant: "cinematic",
  enabled: true,
  order: 1,
  contentConfig: {
    eyebrow: "Private Tanzania Safaris",
    headlineScript: "Tailored journeys across the wild north",
    description: "Plan a thoughtful safari with expert local support.",
    primaryCtaLabel: "Start planning",
    primaryCtaHref: "/tailor-made",
  },
  styleConfig: {
    spacingPreset: "comfortable",
  },
  dataConfig: {},
};

test("buildAiVariantPrompt preserves current page context and design rules", () => {
  const prompt = buildAiVariantPrompt({
    scope: "section",
    customPrompt: "Make it feel like a luxury editorial safari brand.",
    pageConfig: {
      pageType: "home",
      title: "Home",
      sections: [heroSection],
    },
    targetSection: heroSection,
  });

  assert.equal(prompt.includes("advanced classic tourism design"), true);
  assert.equal(prompt.includes("luxury editorial safari brand"), true);
  assert.equal(prompt.includes('"type": "hero"'), true);
  assert.equal(prompt.includes("Return only valid JSON"), true);
});

test("buildClassicDesignVariants returns safe fallback variants without changing section type", () => {
  const variants = buildClassicDesignVariants({
    scope: "section",
    pageConfig: {
      pageType: "home",
      title: "Home",
      sections: [heroSection],
    },
    targetSection: heroSection,
  });

  assert.equal(variants.length, 3);
  assert.equal(variants[0].sections.length, 1);
  assert.equal(variants[0].sections[0].type, "hero");
  assert.notEqual(
    variants[0].sections[0].contentConfig.headlineScript,
    heroSection.contentConfig.headlineScript
  );
  assert.equal(variants[0].sections[0].styleConfig.spacingPreset, "spacious");
});

test("normalizeAiVariantSections removes unsupported structure changes", () => {
  const normalized = normalizeAiVariantSections({
    baseSections: [heroSection],
    incomingSections: [
      {
        type: "unknown",
        variant: "invented",
        enabled: true,
        order: 99,
        contentConfig: { headlineScript: "Bad" },
      },
      {
        type: "hero",
        variant: "cinematic",
        enabled: true,
        order: 6,
        contentConfig: { headlineScript: "Better" },
        styleConfig: { backgroundColor: "#111827" },
      },
    ],
  });

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].type, "hero");
  assert.equal(normalized[0].order, 1);
  assert.equal(normalized[0].contentConfig.headlineScript, "Better");
  assert.equal(normalized[0].styleConfig.backgroundColor, "#111827");
});

