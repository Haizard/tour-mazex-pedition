import test from "node:test";
import assert from "node:assert/strict";

import PageConfig from "../models/PageConfig.js";
import PageBuilderTemplate from "../models/PageBuilderTemplate.js";
import TemplateStudioImportJob from "../models/TemplateStudioImportJob.js";
import ReusableSectionTemplate from "../models/ReusableSectionTemplate.js";
import {
  normalizeTemplateStudioSection,
  normalizeTemplateStudioSections,
} from "../utils/templateStudioSectionModel.js";

test("normalizeTemplateStudioSection produces a complete shared section node", () => {
  const section = normalizeTemplateStudioSection({
    id: "hero-1",
    type: "hero",
    label: "Hero",
    sourceType: "imported",
    sourceMeta: { importJobId: "job-1" },
    order: 2,
    content: { title: "Explore Tanzania" },
  });

  assert.deepEqual(section, {
    id: "hero-1",
    type: "hero",
    label: "Hero",
    sourceType: "imported",
    sourceMeta: { importJobId: "job-1" },
    order: 2,
    enabled: true,
    content: { title: "Explore Tanzania" },
    styles: {},
    bindings: [],
    responsive: {},
    visibility: {},
    customCss: "",
  });
});

test("normalizeTemplateStudioSections gives imported, ai, manual, and reusable sections the same contract", () => {
  const sections = normalizeTemplateStudioSections([
    { type: "hero", sourceType: "imported", content: { title: "Imported" } },
    { type: "gallery", sourceType: "ai", styles: { palette: "warm" } },
    { type: "faq", sourceType: "manual", bindings: [{ source: "faqEntries" }] },
    { type: "cta", sourceType: "reusable", visibility: { audience: "vip" } },
  ]);

  assert.equal(sections.length, 4);

  for (const [index, section] of sections.entries()) {
    assert.ok(section.id);
    assert.equal(typeof section.id, "string");
    assert.equal(typeof section.type, "string");
    assert.equal(typeof section.sourceType, "string");
    assert.equal(section.order, index);
    assert.equal(section.enabled, true);
    assert.ok(section.content && typeof section.content === "object");
    assert.ok(section.styles && typeof section.styles === "object");
    assert.ok(Array.isArray(section.bindings));
    assert.ok(section.responsive && typeof section.responsive === "object");
    assert.ok(section.visibility && typeof section.visibility === "object");
    assert.equal(typeof section.customCss, "string");
  }
});

test("PageConfig keeps templateStudio metadata alongside richer sections", () => {
  const page = new PageConfig({
    tenantId: "64f0f0f0f0f0f0f0f0f0f0f0",
    pageType: "about",
    slug: "/about",
    title: "About",
    templateStudio: {
      pageId: "page_about_1",
      sourceType: "imported",
      layoutShell: "marketing",
      themeTokens: { accent: "#0d9488" },
    },
    sections: [
      {
        type: "hero",
        variant: "default",
        order: 0,
        enabled: true,
        contentConfig: { title: "About Us" },
        studioMeta: {
          id: "hero-1",
          sourceType: "imported",
          bindings: [{ field: "headline", source: "static" }],
        },
      },
    ],
  });

  const serialized = page.toObject();

  assert.equal(serialized.templateStudio.pageId, "page_about_1");
  assert.equal(serialized.templateStudio.layoutShell, "marketing");
  assert.deepEqual(serialized.templateStudio.themeTokens, { accent: "#0d9488" });
  assert.equal(serialized.sections[0].studioMeta.id, "hero-1");
  assert.equal(serialized.sections[0].studioMeta.sourceType, "imported");
  assert.deepEqual(serialized.sections[0].studioMeta.bindings, [
    { field: "headline", source: "static" },
  ]);
});

test("PageBuilderTemplate stores richer template studio payloads", () => {
  const template = new PageBuilderTemplate({
    id: "about-studio-template",
    name: "About Studio Template",
    category: "about",
    pageType: "about",
    preview: "A polished about page",
    templateSource: {
      mode: "import-and-bind",
      importJobId: "job_123",
    },
    themeTokens: {
      colors: { accent: "#0f766e" },
      spacing: { sectionGap: "48px" },
    },
    sections: [
      {
        id: "hero-1",
        type: "hero",
        sourceType: "imported",
        content: { title: "Crafted with care" },
        styles: { align: "center" },
        bindings: [],
        responsive: {},
        visibility: {},
        order: 0,
      },
    ],
  });

  const serialized = template.toObject();

  assert.equal(serialized.templateSource.mode, "import-and-bind");
  assert.equal(serialized.templateSource.importJobId, "job_123");
  assert.equal(serialized.themeTokens.colors.accent, "#0f766e");
  assert.equal(serialized.sections[0].sourceType, "imported");
  assert.equal(serialized.sections[0].content.title, "Crafted with care");
});

test("PageBuilderTemplate can be re-imported without OverwriteModelError", async () => {
  const reloaded = await import(`../models/PageBuilderTemplate.js?reload=${Date.now()}`);

  assert.equal(reloaded.default, PageBuilderTemplate);
});

test("Template Studio foundation models expose the expected model names", () => {
  assert.equal(TemplateStudioImportJob.modelName, "TemplateStudioImportJob");
  assert.equal(ReusableSectionTemplate.modelName, "ReusableSectionTemplate");
});
