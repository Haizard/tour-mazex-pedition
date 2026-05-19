import test from "node:test";
import assert from "node:assert/strict";

import { buildPreviewPageModel } from "./previewUtils.js";

test("buildPreviewPageModel prepares page metadata and styled sections for preview", () => {
  const preview = buildPreviewPageModel({
    page: {
      pageName: "About Us",
      slug: "/about",
      status: "draft",
      sections: [
        {
          id: "hero",
          label: "Hero",
          content: { title: "Climb with us", body: "Trusted expeditions." },
          styles: {
            backgroundColor: "#fffaf5",
            accentColor: "#9a3412",
          },
        },
      ],
      themeTokens: {
        canvasBackground: "#f8fafc",
      },
    },
    viewport: "tablet",
  });

  assert.equal(preview.pageName, "About Us");
  assert.equal(preview.slug, "/about");
  assert.equal(preview.viewport, "tablet");
  assert.equal(preview.sections.length, 1);
  assert.equal(preview.sections[0].presentation.containerStyle.backgroundColor, "#fffaf5");
  assert.equal(preview.theme.canvasBackground, "#f8fafc");
});

test("buildPreviewPageModel creates CMS-aware preview data and applies page theme token fallbacks", () => {
  const preview = buildPreviewPageModel({
    page: {
      pageName: "Tours",
      sections: [
        {
          id: "tour-grid",
          label: "Featured Tours",
          type: "featuredPackages",
          bindings: [
            {
              sourceKey: "tourPackages",
              bindingType: "dynamic-collection",
              fieldPath: "items",
            },
          ],
        },
      ],
      themeTokens: {
        accentColor: "#8b5cf6",
        sectionBackground: "#f5f3ff",
      },
    },
  });

  assert.equal(preview.sections[0].previewData.kind, "collection");
  assert.equal(preview.sections[0].previewData.items.length, 3);
  assert.equal(preview.sections[0].presentation.badgeStyle.color, "#8b5cf6");
  assert.equal(preview.sections[0].presentation.containerStyle.backgroundColor, "#f5f3ff");
});
