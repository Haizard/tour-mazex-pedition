import test from "node:test";
import assert from "node:assert/strict";

import {
  buildImportedSectionFromSource,
  extractEditableContentFromHtml,
  sanitizeImportedHtml,
  scopeImportedCss,
} from "../utils/pageBuilderSourceImport.js";

const pastedSource = `
<section class="luxury-hero" onclick="alert('bad')">
  <img src="https://example.com/hero.jpg" alt="Serengeti camp">
  <p class="eyebrow">Signature Safaris</p>
  <h1>Classic Tanzania, beautifully planned</h1>
  <p>Private guides, elegant camps, and a calm planning process.</p>
  <a href="/tailor-made">Design my safari</a>
  <script>alert("bad")</script>
</section>
<style>
  .luxury-hero { background: #08111f; color: white; padding: 96px 40px; }
  .luxury-hero h1 { font-size: 64px; }
</style>
`;

test("sanitizeImportedHtml removes scripts and inline event handlers", () => {
  const sanitized = sanitizeImportedHtml(pastedSource);

  assert.equal(sanitized.includes("<script"), false);
  assert.equal(sanitized.includes("onclick"), false);
  assert.equal(sanitized.includes("Classic Tanzania"), true);
});

test("extractEditableContentFromHtml finds text, images, and links", () => {
  const extracted = extractEditableContentFromHtml(sanitizeImportedHtml(pastedSource));

  assert.equal(extracted.title, "Classic Tanzania, beautifully planned");
  assert.equal(extracted.eyebrow, "Signature Safaris");
  assert.equal(extracted.body.includes("Private guides"), true);
  assert.equal(extracted.imageUrl, "https://example.com/hero.jpg");
  assert.equal(extracted.ctaLabel, "Design my safari");
  assert.equal(extracted.ctaHref, "/tailor-made");
});

test("scopeImportedCss prevents imported CSS from leaking outside the section", () => {
  const scoped = scopeImportedCss(".luxury-hero { color: white; }\nh1 { font-size: 64px; }", "pb-import-abc");

  assert.equal(scoped.includes(".pb-import-abc .luxury-hero"), true);
  assert.equal(scoped.includes(".pb-import-abc h1"), true);
});

test("buildImportedSectionFromSource converts pasted source into editable customHtml section", () => {
  const section = buildImportedSectionFromSource({
    sourceCode: pastedSource,
    name: "Luxury Hero Import",
  });

  assert.equal(section.type, "customHtml");
  assert.equal(section.variant, "imported");
  assert.equal(section.enabled, true);
  assert.equal(section.contentConfig.title, "Classic Tanzania, beautifully planned");
  assert.equal(section.contentConfig.ctaLabel, "Design my safari");
  assert.equal(section.contentConfig.htmlTemplate.includes("{{title}}"), true);
  assert.equal(section.styleConfig.customCss.includes(`.${section.styleConfig.scopeClass}`), true);
  assert.equal(section.contentConfig.htmlTemplate.includes("<script"), false);
});

