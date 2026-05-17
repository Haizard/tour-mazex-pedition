import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPersonalizedTemplatePage,
  getTemplateCatalog,
  getTemplateById,
  isTemplateUsable,
  resolveTemplateCatalogForTenant,
} from "./templateMarketplace.js";

test("template catalog exposes tourism page-builder templates", () => {
  const catalog = getTemplateCatalog();

  assert.ok(catalog.length >= 3);
  assert.ok(catalog.every((template) => template.id && template.name));
  assert.ok(catalog.every((template) => template.pageType));
  assert.ok(catalog.every((template) => Array.isArray(template.sections)));
  assert.ok(catalog.every((template) => template.sections.every((section) => section.type && section.variant)));
});

test("only purchased or included templates are directly usable", () => {
  assert.equal(isTemplateUsable({ purchaseStatus: "purchased" }), true);
  assert.equal(isTemplateUsable({ purchaseStatus: "included" }), true);
  assert.equal(isTemplateUsable({ purchaseStatus: "available" }), false);
});

test("personalized template pages preserve sections and add client-specific changes", () => {
  const template = getTemplateById("safari-signature-home");
  const personalized = buildPersonalizedTemplatePage(template, {
    clientName: "Kili Trails",
    accentSeed: "Kili Trails",
  });

  assert.equal(personalized.pageType, "home");
  assert.equal(personalized.templateSource.templateId, "safari-signature-home");
  assert.equal(personalized.sections.length, template.sections.length);
  assert.equal(personalized.sections[0].order, 1);
  assert.match(personalized.sections[0].contentConfig.description, /Kili Trails/);
  assert.notEqual(
    personalized.sections[0].styleConfig.accentColor,
    template.sections[0].styleConfig.accentColor
  );
});

test("unusable templates cannot be personalized into a page", () => {
  const template = getTemplateById("island-escape-landing");

  assert.throws(
    () => buildPersonalizedTemplatePage(template, { clientName: "Island Co" }),
    /not purchased/
  );
});

test("tenant entitlements mark available templates as purchased", () => {
  const catalog = resolveTemplateCatalogForTenant({
    purchasedTemplates: ["island-escape-landing"],
  });
  const islandTemplate = catalog.find((template) => template.id === "island-escape-landing");

  assert.equal(islandTemplate.purchaseStatus, "purchased");
  assert.equal(islandTemplate.priceLabel, "Purchased");
  assert.equal(isTemplateUsable(islandTemplate), true);
});

test("tenant requests mark available templates as requested", () => {
  const catalog = resolveTemplateCatalogForTenant({
    requestedTemplates: ["island-escape-landing"],
  });
  const islandTemplate = catalog.find((template) => template.id === "island-escape-landing");

  assert.equal(islandTemplate.purchaseStatus, "requested");
  assert.equal(islandTemplate.priceLabel, "Requested");
  assert.equal(isTemplateUsable(islandTemplate), false);
});
