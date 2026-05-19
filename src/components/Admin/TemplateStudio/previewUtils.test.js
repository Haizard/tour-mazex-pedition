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
