import test from "node:test";
import assert from "node:assert/strict";
import {
  collectTenantPageConfigLinkEntries,
  normalizeTenantLinkInput,
  validateTenantManagedLink,
  validateTenantManagedLinks,
  validateTenantPageConfigLinks,
} from "./tenantLinkValidation.js";

test("normalizeTenantLinkInput trims tenant link values", () => {
  assert.equal(normalizeTenantLinkInput("  /blogs  "), "/blogs");
});

test("validateTenantManagedLink accepts internal and external links", () => {
  assert.equal(validateTenantManagedLink("/blogs", "Blog link"), "");
  assert.equal(validateTenantManagedLink("https://example.com/offer", "Promo link"), "");
  assert.equal(validateTenantManagedLink("mailto:hello@example.com", "Email link"), "");
});

test("validateTenantManagedLink rejects platform URLs and demo paths", () => {
  assert.match(
    validateTenantManagedLink("https://mazexpeditions.vercel.app/blogs", "Blog link"),
    /full platform URL/i,
  );
  assert.match(
    validateTenantManagedLink("/demo/mazepro/blogs", "Blog link"),
    /should not include \/demo/i,
  );
});

test("validateTenantManagedLink rejects malformed internal paths", () => {
  assert.match(
    validateTenantManagedLink("blogs", "Blog link"),
    /should start with \//i,
  );
});

test("validateTenantManagedLinks returns all validation failures", () => {
  assert.deepEqual(
    validateTenantManagedLinks([
      { label: "Primary CTA", value: "/contact" },
      { label: "Footer Blog", value: "blogs" },
      { label: "About link", value: "/demo/mazepro/about" },
    ]),
    [
      "Footer Blog should start with / for internal pages, or use a full external URL.",
      "About link should not include /demo/... paths. Use a tenant-relative path like /blogs instead.",
    ],
  );
});

test("collectTenantPageConfigLinkEntries finds page-builder CTA links", () => {
  const pageConfig = {
    sections: [
      {
        type: "hero",
        variant: "default",
        contentConfig: {
          primaryCtaHref: "/contact",
          secondaryCtaHref: "blogs",
        },
      },
      {
        type: "customHtml",
        variant: "default",
        contentConfig: {
          ctaHref: "/demo/mazepro/packages",
        },
      },
    ],
  };
  const sectionRegistry = {
    getEditorSchema(type) {
      if (type === "hero") {
        return [
          { group: "contentConfig", path: "primaryCtaHref", type: "text", placeholder: "Primary CTA link" },
          { group: "contentConfig", path: "secondaryCtaHref", type: "text", placeholder: "Secondary CTA link" },
        ];
      }

      if (type === "customHtml") {
        return [
          { group: "contentConfig", path: "ctaHref", type: "text", placeholder: "CTA link" },
        ];
      }

      return [];
    },
    getStyleSchema() {
      return [];
    },
  };

  assert.deepEqual(collectTenantPageConfigLinkEntries(pageConfig, sectionRegistry), [
    { label: "Section 1 (hero) Primary CTA link", value: "/contact" },
    { label: "Section 1 (hero) Secondary CTA link", value: "blogs" },
    { label: "Section 2 (customHtml) CTA link", value: "/demo/mazepro/packages" },
  ]);
});

test("validateTenantPageConfigLinks rejects invalid page-builder links", () => {
  const pageConfig = {
    sections: [
      {
        type: "hero",
        variant: "default",
        contentConfig: {
          primaryCtaHref: "contact",
        },
      },
    ],
  };
  const sectionRegistry = {
    getEditorSchema() {
      return [
        { group: "contentConfig", path: "primaryCtaHref", type: "text", placeholder: "Primary CTA link" },
      ];
    },
    getStyleSchema() {
      return [];
    },
  };

  assert.deepEqual(validateTenantPageConfigLinks(pageConfig, sectionRegistry), [
    "Section 1 (hero) Primary CTA link should start with / for internal pages, or use a full external URL.",
  ]);
});
