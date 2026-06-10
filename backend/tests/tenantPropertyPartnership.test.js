import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateMarketplacePayout,
} from "../utils/tenantPartnershipLookup.js";

// ── Model tests ─────────────────────────────────────────────────────────────

test("TenantPropertyPartnership model defines expected schema fields", async () => {
  const mod = await import("../models/TenantPropertyPartnership.js");
  const Partnership = mod.default;

  // Verify the model exists and is a Mongoose model
  assert.equal(typeof Partnership, "function");
  assert.equal(typeof Partnership.schema, "object");

  const paths = Partnership.schema.paths;

  // Required fields
  assert.equal(paths.tenantId.options.required, true);
  assert.equal(paths.tenantId.instance, "ObjectId");
  assert.equal(paths.tenantId.options.ref, "Tenant");

  assert.equal(paths.propertyId.options.required, true);
  assert.equal(paths.propertyId.instance, "ObjectId");

  assert.equal(paths.propertyType.options.required, true);
  assert.equal(paths.propertyType.options.enum.includes("restaurant"), true);
  assert.equal(paths.propertyType.options.enum.includes("hotel"), true);

  // Optional fields with defaults
  assert.equal(paths.propertyName.options.default, "");
  assert.equal(paths.propertyName.options.trim, true);

  assert.equal(paths.propertySlug.options.default, "");
  assert.equal(paths.propertySlug.options.trim, true);

  assert.equal(paths.commissionPercent.options.default, 0);
  assert.equal(paths.commissionPercent.options.min, 0);
  assert.equal(paths.commissionPercent.options.max, 100);

  assert.equal(paths.status.options.default, "active");
  assert.equal(paths.status.options.enum.includes("active"), true);
  assert.equal(paths.status.options.enum.includes("suspended"), true);
  assert.equal(paths.status.options.enum.includes("pending"), true);

  assert.equal(paths.dealNotes.options.default, "");
  assert.equal(paths.dealNotes.options.trim, true);

  // ownerTenantId is optional
  assert.equal(paths.ownerTenantId.instance, "ObjectId");
  assert.equal(paths.ownerTenantId.options.ref, "Tenant");
  assert.equal(paths.ownerTenantId.options.default, null);
});

test("TenantPropertyPartnership has correct indexes", async () => {
  const { default: Partnership } = await import("../models/TenantPropertyPartnership.js");
  const indexes = Partnership.schema.indexes();

  const uniqueCompound = indexes.find(
    ([fields]) =>
      fields.tenantId === 1 && fields.propertyId === 1 && fields.propertyType === 1
  );
  assert.equal(!!uniqueCompound, true, "Missing compound unique index on tenantId+propertyId+propertyType");
  assert.equal(uniqueCompound[0].tenantId, 1);
  assert.equal(uniqueCompound[0].propertyId, 1);
  assert.equal(uniqueCompound[0].propertyType, 1);
  assert.equal(uniqueCompound[1].unique, true);

  const tenantStatusIndex = indexes.find(
    ([fields]) => fields.tenantId === 1 && fields.status === 1
  );
  assert.equal(!!tenantStatusIndex, true, "Missing compound index on tenantId+status");

  const propertyIndex = indexes.find(
    ([fields]) => fields.propertyId === 1 && fields.propertyType === 1
  );
  assert.equal(!!propertyIndex, true, "Missing compound index on propertyId+propertyType");
});

test("TenantPropertyPartnership schema has timestamps enabled", async () => {
  const { default: Partnership } = await import("../models/TenantPropertyPartnership.js");

  assert.equal(Partnership.schema.options.timestamps, true);
  assert.equal(!!Partnership.schema.paths.createdAt, true, "Missing createdAt timestamp field");
  assert.equal(!!Partnership.schema.paths.updatedAt, true, "Missing updatedAt timestamp field");
});

test("TenantPropertyPartnership uses singleton pattern (reuses existing model)", async () => {
  const mod = await import("../models/TenantPropertyPartnership.js");
  const Partnership = mod.default;

  // The model name should be registered
  assert.equal(Partnership.modelName, "TenantPropertyPartnership");
});

// ── shapePartnership (internal route utility) tests ─────────────────────────

test("shapePartnership serializes a partnership document to API shape", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/tenantPartnershipRoutes.js", import.meta.url), "utf8")
  );

  // Verify the shapePartnership function builds the correct output fields
  assert.equal(source.includes("commissionPercent"), true);
  assert.equal(source.includes("dealNotes"), true);
  assert.equal(source.includes("propertyType"), true);
  assert.equal(source.includes("propertyName"), true);
  assert.equal(source.includes("propertySlug"), true);
  assert.equal(source.includes("ownerTenantId"), true);
  assert.equal(source.includes("createdAt"), true);
  assert.equal(source.includes("updatedAt"), true);

  // Verify autoConfirmBooking was removed
  assert.equal(source.includes("autoConfirmBooking"), false);
});

// ── Utility function tests ──────────────────────────────────────────────────

test("calculateMarketplacePayout computes correct payout for valid inputs", () => {
  // 7% of $200 = $14
  assert.equal(calculateMarketplacePayout(200, 7), 14);

  // 10% of $1000 = $100
  assert.equal(calculateMarketplacePayout(1000, 10), 100);

  // 15% of $50 = $7.50
  assert.equal(calculateMarketplacePayout(50, 15), 7.5);

  // 0% commission = $0
  assert.equal(calculateMarketplacePayout(500, 0), 0);

  // 100% of $100 = $100
  assert.equal(calculateMarketplacePayout(100, 100), 100);
});

test("calculateMarketplacePayout clamps commissionPercent to 0-100", () => {
  // Negative percent clamped to 0
  assert.equal(calculateMarketplacePayout(100, -10), 0);

  // Over 100 clamped to 100
  assert.equal(calculateMarketplacePayout(100, 150), 100);

  // 0 works
  assert.equal(calculateMarketplacePayout(100, 0), 0);
});

test("calculateMarketplacePayout handles edge cases gracefully", () => {
  // Zero amount
  assert.equal(calculateMarketplacePayout(0, 10), 0);

  // Null/undefined
  assert.equal(calculateMarketplacePayout(null, 10), 0);
  assert.equal(calculateMarketplacePayout(100, null), 0);
  assert.equal(calculateMarketplacePayout(undefined, 10), 0);
  assert.equal(calculateMarketplacePayout(100, undefined), 0);

  // Empty calls with defaults
  assert.equal(calculateMarketplacePayout(), 0);
  assert.equal(calculateMarketplacePayout(100), 0);
});

test("calculateMarketplacePayout rounds to 2 decimal places", () => {
  // 7.5% of $99.99 = $7.49925 → $7.50
  assert.equal(calculateMarketplacePayout(99.99, 7.5), 7.5);

  // 3.333% of $100 = $3.333 → $3.33
  assert.equal(calculateMarketplacePayout(100, 3.333), 3.33);

  // 0.5% of $1000 = $5
  assert.equal(calculateMarketplacePayout(1000, 0.5), 5);
});

// ── Route registration tests ───────────────────────────────────────────────

test("tenantPartnershipRoutes exports an Express router", async () => {
  const module = await import("../routes/tenantPartnershipRoutes.js");

  assert.equal(typeof module.default, "function");
  assert.equal(typeof module.default.use, "function");
});

test("server registers tenant partnership routes", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../server.js", import.meta.url), "utf8")
  );

  assert.equal(
    source.includes('from "./routes/tenantPartnershipRoutes.js"'),
    true
  );
  assert.equal(
    source.includes('app.use("/api/partner-properties", tenantPartnershipRoutes)'),
    true
  );
});

test("tenant partnership routes register public endpoints before admin auth", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/tenantPartnershipRoutes.js", import.meta.url),
      "utf8"
    )
  );

  const publicIndex = source.indexOf('router.get("/public"');
  const publicIdsIndex = source.indexOf('router.get("/public/ids"');
  const adminAuthIndex = source.indexOf("router.use(requireTenantAdmin)");

  assert.equal(publicIndex > -1, true, "Missing GET /public endpoint");
  assert.equal(publicIdsIndex > -1, true, "Missing GET /public/ids endpoint");
  assert.equal(publicIndex < adminAuthIndex, true, "/public must be registered before auth middleware");
  assert.equal(publicIdsIndex < adminAuthIndex, true, "/public/ids must be registered before auth middleware");
});

test("tenant partnership routes expose all CRUD endpoints after admin auth", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/tenantPartnershipRoutes.js", import.meta.url),
      "utf8"
    )
  );

  assert.equal(source.includes('router.get("/"'), true);
  assert.equal(source.includes('router.get("/available"'), true);
  assert.equal(source.includes('router.post("/"'), true);
  assert.equal(source.includes('router.patch("/:id"'), true);
  assert.equal(source.includes('router.delete("/:id"'), true);
});

test("tenant partnership routes reference required dependencies", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/tenantPartnershipRoutes.js", import.meta.url),
      "utf8"
    )
  );

  assert.equal(source.includes("TenantPropertyPartnership"), true);
  assert.equal(source.includes("Restaurant"), true);
  assert.equal(source.includes("Hotel"), true);
  assert.equal(source.includes("requireTenantAdmin"), true);
  assert.equal(source.includes("buildTenantFilter"), true);
  assert.equal(source.includes("withTenantId"), true);
});

test("tenant partnership /public endpoint returns empty properties when no tenant", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/tenantPartnershipRoutes.js", import.meta.url),
      "utf8"
    )
  );

  assert.equal(
    source.includes('return res.status(200).json({ properties: [] })'),
    true,
    "/public should return empty properties array when no tenant context"
  );
});

test("tenant partnership public endpoint returns hasTenantContext flag", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/tenantPartnershipRoutes.js", import.meta.url),
      "utf8"
    )
  );

  assert.equal(
    source.includes("hasTenantContext: false"),
    true,
    "No-tenant response should include hasTenantContext: false"
  );
  assert.equal(
    source.includes("hasTenantContext: true"),
    true,
    "Tenant response should include hasTenantContext: true"
  );
});

test("tenant partnership routes handle validation for POST create", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/tenantPartnershipRoutes.js", import.meta.url),
      "utf8"
    )
  );

  // Check for 400 validation on missing propertyId
  assert.equal(
    source.includes('"Property ID and type (restaurant or hotel) are required."'),
    true
  );

  // Check for 404 on non-existent property
  assert.equal(source.includes('"Property not found."'), true);

  // Check for duplicate partnership check (409)
  assert.equal(
    source.includes('"A partnership with this property already exists."'),
    true
  );
});

test("tenant partnership routes handle 404 on PATCH and DELETE", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/tenantPartnershipRoutes.js", import.meta.url),
      "utf8"
    )
  );

  // PATCH 404
  assert.equal(
    source.includes('"Partnership not found."'),
    true
  );

  // DELETE 404
  assert.equal(
    source.includes('"Partnership not found."'),
    true
  );
});

test("tenant partnership routes support field-level PATCH updates", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/tenantPartnershipRoutes.js", import.meta.url),
      "utf8"
    )
  );

  assert.equal(source.includes("commissionPercent"), true);
  assert.equal(source.includes("dealNotes"), true);
  assert.equal(source.includes("status"), true);

  // autoConfirmBooking should NOT be in PATCH updates
  assert.equal(source.includes("autoConfirmBooking"), false);
});

test("tenant partnership available endpoint searches by property type", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/tenantPartnershipRoutes.js", import.meta.url),
      "utf8"
    )
  );

  assert.equal(source.includes('req.query.propertyType'), true);
  assert.equal(source.includes('"restaurant"'), true);
  assert.equal(source.includes('"hotel"'), true);
  assert.equal(source.includes('query.$or'), true);
  assert.equal(source.includes('$regex'), true);
  assert.equal(source.includes('.limit(20)'), true);
});

// ── Frontend API function tests ─────────────────────────────────────────────

test("client API exports tenant partnership helpers", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../../src/services/api.js", import.meta.url), "utf8")
  );

  assert.equal(
    source.includes("export const fetchTenantPartnershipIds"),
    true
  );
  assert.equal(
    source.includes("/partner-properties/public/ids"),
    true
  );
  assert.equal(
    source.includes("export const fetchTenantPartnershipsPublic"),
    true
  );
  assert.equal(
    source.includes("/partner-properties/public"),
    true
  );
  assert.equal(
    source.includes("export const fetchAvailablePropertiesForPartnership"),
    true
  );
  assert.equal(source.includes("/partner-properties/available"), true);

  // CRUD
  assert.equal(source.includes("export const createTenantPartnership"), true);
  assert.equal(source.includes("API.post(\"/partner-properties\""), true);
  assert.equal(source.includes("export const updateTenantPartnership"), true);
  assert.equal(source.includes("API.patch(`/partner-properties/"), true);
  assert.equal(source.includes("export const deleteTenantPartnership"), true);
  assert.equal(source.includes("API.delete(`/partner-properties/"), true);
});

// ── AdminSidebar navigation test ────────────────────────────────────────────

test("admin sidebar includes Partner Properties navigation entry", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../../src/components/Admin/AdminSidebar.jsx", import.meta.url),
      "utf8"
    )
  );

  assert.equal(
    source.includes('"partner-properties"'),
    true,
    "AdminSidebar should have a 'partner-properties' tab entry"
  );
  assert.equal(
    source.includes("Partner Properties"),
    true,
    "AdminSidebar should display 'Partner Properties' label"
  );
});

// ── AdminDashboard rendering test ─────────────────────────────────────────────

test("admin dashboard renders PartnerPropertyManager component", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../../src/pages/AdminDashboard.jsx", import.meta.url),
      "utf8"
    )
  );

  assert.equal(
    source.includes("PartnerPropertyManager"),
    true,
    "AdminDashboard should import PartnerPropertyManager"
  );
  assert.equal(
    source.includes('"partner-properties"'),
    true,
    "AdminDashboard should render PartnerPropertyManager for partner-properties tab"
  );
});

// ── Tenant partnership lookup utility test ──────────────────────────────────

test("tenantPartnershipLookup exports expected functions", async () => {
  const mod = await import("../utils/tenantPartnershipLookup.js");

  assert.equal(typeof mod.lookupTenantPropertyCommission, "function");
  assert.equal(typeof mod.calculateMarketplacePayout, "function");
  assert.equal(typeof mod.default, "function");
  assert.equal(mod.default.name, "lookupTenantPropertyCommission");
});

// ── Tenant partnership lookup utility tests ────────────────────────────────

test("lookupTenantPropertyCommission returns null when tenantId or propertyId is empty", async () => {
  const { lookupTenantPropertyCommission } = await import("../utils/tenantPartnershipLookup.js");

  // Empty tenantId
  const noTenant = await lookupTenantPropertyCommission("", "some-property-id", "hotel");
  assert.equal(noTenant, null, "Should return null when tenantId is empty");

  // Empty propertyId
  const noProperty = await lookupTenantPropertyCommission("some-tenant-id", "", "hotel");
  assert.equal(noProperty, null, "Should return null when propertyId is empty");

  // Both empty
  const bothEmpty = await lookupTenantPropertyCommission("", "", "hotel");
  assert.equal(bothEmpty, null, "Should return null when both are empty");
});

// ── Commission flow integration tests ──────────────────────────────────────

test("hotel checkout route references marketplace commission fields", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/hotelRoutes.js", import.meta.url),
      "utf8"
    )
  );

  assert.equal(
    source.includes("lookupTenantPropertyCommission"),
    true,
    "Hotel routes should import lookupTenantPropertyCommission"
  );
  assert.equal(
    source.includes("marketplacePayoutAmount"),
    true,
    "Hotel checkout should include marketplacePayoutAmount"
  );
  assert.equal(
    source.includes("distributorTenantId"),
    true,
    "Hotel checkout should include distributorTenantId"
  );
  assert.equal(
    source.includes("marketplaceCommissionPercent"),
    true,
    "Hotel checkout should include marketplaceCommissionPercent"
  );
});

test("restaurant checkout auto-deposit references marketplace commission fields", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../utils/restaurantCheckout.js", import.meta.url),
      "utf8"
    )
  );

  assert.equal(
    source.includes("lookupTenantPropertyCommission"),
    true,
    "Restaurant checkout should reference lookupTenantPropertyCommission"
  );
  assert.equal(
    source.includes("marketplacePayoutAmount"),
    true,
    "Restaurant auto-deposit should include marketplacePayoutAmount"
  );
});

test("restaurant routes manual payment references marketplace commission fields", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../routes/restaurantRoutes.js", import.meta.url),
      "utf8"
    )
  );

  assert.equal(
    source.includes("lookupTenantPropertyCommission"),
    true,
    "Restaurant routes should import lookupTenantPropertyCommission"
  );
  assert.equal(
    source.includes("marketplacePayoutAmount"),
    true,
    "Restaurant payment request should include marketplacePayoutAmount"
  );
});
