import test from "node:test";
import assert from "node:assert/strict";

import { createTemplateStudioImportDraft } from "../utils/templateStudioImportPipeline.js";

const htmlPageSource = `
<section class="hero">
  <h1>Explore Tanzania</h1>
  <p>Private safaris, mountain treks, and island escapes.</p>
  <a href="/contact">Talk to a specialist</a>
</section>
<section class="tour-grid">
  <h2>Featured tours</h2>
  <article><h3>Serengeti Signature</h3></article>
  <article><h3>Kilimanjaro Summit</h3></article>
</section>
<style>
  .hero { padding: 80px; background: #08111f; color: white; }
  .tour-grid { display: grid; gap: 24px; }
</style>
`;

test("createTemplateStudioImportDraft converts an HTML/CSS page into ordered studio sections", () => {
  const result = createTemplateStudioImportDraft({
    sourceType: "html-css-page",
    sourceCode: htmlPageSource,
    name: "Explore Tanzania Landing",
  });

  assert.equal(result.importJob.sourceType, "html-css-page");
  assert.equal(result.sectionDrafts.length, 2);
  assert.equal(result.sectionDrafts[0].order, 1);
  assert.equal(result.sectionDrafts[1].order, 2);
  assert.equal(result.pageDraft.sections.length, 2);
  assert.equal(result.assets.stylesheets.length, 1);
});

test("createTemplateStudioImportDraft converts a section snippet into one reusable candidate", () => {
  const result = createTemplateStudioImportDraft({
    sourceType: "html-snippet",
    sourceCode:
      '<section class="testimonial-strip"><h2>What travelers say</h2><p>Real stories from guests</p></section>',
    name: "Testimonial Strip",
  });

  assert.equal(result.sectionDrafts.length, 1);
  assert.equal(result.sectionDrafts[0].label, "Testimonial Strip");
  assert.equal(result.pageDraft.sections.length, 1);
});

test("createTemplateStudioImportDraft flags unsupported script fragments instead of silently keeping them", () => {
  const result = createTemplateStudioImportDraft({
    sourceType: "html-css-page",
    sourceCode:
      '<section><h1>Animated counter</h1><script>window.startCounter()</script><p>Trusted by travelers</p></section>',
    name: "Animated Counter",
  });

  assert.equal(result.unsupportedFragments.length, 1);
  assert.match(result.unsupportedFragments[0], /script/i);
});
