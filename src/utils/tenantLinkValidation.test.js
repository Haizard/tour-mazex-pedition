import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTenantLinkInput,
  validateTenantManagedLink,
  validateTenantManagedLinks,
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
