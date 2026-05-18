import test from "node:test";
import assert from "node:assert/strict";

import PageConfig from "../models/PageConfig.js";
import {
  buildPageConfigFromStudioPage,
  buildStudioPageFromPageConfig,
} from "../utils/templateStudioPagePersistence.js";

test("buildStudioPageFromPageConfig expands a stored page config into a studio canvas", () => {
  const page = new PageConfig({
    tenantId: "64f0f0f0f0f0f0f0f0f0f0f0",
    pageType: "about",
    slug: "/about",
    title: "About Us",
    sections: [
      {
        type: "hero",
        order: 1,
        enabled: true,
        contentConfig: { title: "About Maz" },
        styleConfig: { accentColor: "#0f766e" },
      },
    ],
  });

  const studioPage = buildStudioPageFromPageConfig(page.toObject());

  assert.equal(studioPage.slug, "/about");
  assert.equal(studioPage.sections.length, 1);
  assert.equal(studioPage.sections[0].sourceType, "manual");
});

test("buildPageConfigFromStudioPage converts a canvas page back into PageConfig shape", () => {
  const payload = buildPageConfigFromStudioPage({
    studioPage: {
      pageType: "landing",
      slug: "/migration",
      title: "Migration Campaign",
      status: "draft",
      seo: { title: "Migration Campaign" },
      themeTokens: { accentColor: "#b45309" },
      sections: [
        {
          id: "section-hero",
          type: "hero",
          label: "Hero",
          order: 1,
          enabled: true,
          sourceType: "imported",
          content: { title: "Catch the migration" },
          styles: { accentColor: "#b45309" },
          bindings: [],
        },
      ],
    },
    tenantId: "64f0f0f0f0f0f0f0f0f0f0f0",
  });

  assert.equal(payload.tenantId, "64f0f0f0f0f0f0f0f0f0f0f0");
  assert.equal(payload.sections[0].contentConfig.title, "Catch the migration");
  assert.equal(payload.templateStudio.themeTokens.accentColor, "#b45309");
});
