import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCanvasSectionStyle,
  resolveSectionStyleTokens,
} from "./canvasSectionStyles.js";

test("resolveSectionStyleTokens prefers responsive overrides for the active viewport", () => {
  const tokens = resolveSectionStyleTokens(
    {
      styles: {
        accentColor: "#0f766e",
        paddingY: "72px",
        gap: "24px",
      },
      responsive: {
        mobile: {
          paddingY: "32px",
          gap: "12px",
          columns: "1",
        },
      },
    },
    "mobile"
  );

  assert.equal(tokens.paddingY, "32px");
  assert.equal(tokens.gap, "12px");
  assert.equal(tokens.columns, "1");
  assert.equal(tokens.accentColor, "#0f766e");
});

test("buildCanvasSectionStyle produces visible inline styling hooks", () => {
  const presentation = buildCanvasSectionStyle(
    {
      styles: {
        backgroundColor: "#f8fafc",
        textColor: "#111827",
        accentColor: "#2563eb",
        radius: "32px",
        headlineSize: "2rem",
      },
    },
    "desktop",
    true
  );

  assert.equal(presentation.containerStyle.backgroundColor, "#f8fafc");
  assert.equal(presentation.containerStyle.borderRadius, "32px");
  assert.equal(presentation.headlineStyle.fontSize, "2rem");
  assert.match(String(presentation.containerStyle.boxShadow), /0 0 0 2px/);
});
