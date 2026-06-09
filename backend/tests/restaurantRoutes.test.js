import test from "node:test";
import assert from "node:assert/strict";

test("restaurantRoutes exports an Express router", async () => {
  const module = await import("../routes/restaurantRoutes.js");

  assert.equal(typeof module.default, "function");
  assert.equal(typeof module.default.use, "function");
});

test("server registers restaurant routes", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../server.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('from "./routes/restaurantRoutes.js"'), true);
  assert.equal(source.includes('app.use("/api/restaurants", restaurantRoutes)'), true);
});

test("restaurant routes include public AI concierge recommendations before admin auth", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );
  const conciergeIndex = source.indexOf('router.post("/public/concierge/recommendations"');
  const adminAuthIndex = source.indexOf("router.use(requireTenantAdmin)");

  assert.equal(conciergeIndex > -1, true);
  assert.equal(conciergeIndex < adminAuthIndex, true);
  assert.equal(source.includes("buildRestaurantConciergeRecommendations"), true);
});

test("restaurant routes expose public claim request search and intake before admin auth", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );
  const claimSearchIndex = source.indexOf('router.get("/public/claim-search"');
  const claimCreateIndex = source.indexOf('router.post("/public/claims"');
  const adminAuthIndex = source.indexOf("router.use(requireTenantAdmin)");

  assert.equal(claimSearchIndex > -1, true);
  assert.equal(claimCreateIndex > -1, true);
  assert.equal(claimSearchIndex < adminAuthIndex, true);
  assert.equal(claimCreateIndex < adminAuthIndex, true);
  assert.equal(source.includes("RestaurantClaimRequest"), true);
  assert.equal(source.includes("buildRestaurantClaimRequestPayload"), true);
  assert.equal(source.includes("shapeRestaurantClaimQueueItem"), true);
});

test("restaurant routes expose tenant-admin claim moderation workflow", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.get("/claims"'), true);
  assert.equal(source.includes('router.post("/claims/:id/review"'), true);
  assert.equal(source.includes("buildRestaurantClaimReviewUpdate"), true);
  assert.equal(source.includes("RestaurantPartnerAdmin.create"), true);
});

test("restaurant routes expose public discovery/detail and tenant-admin CRUD", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.get("/public"'), true);
  assert.equal(source.includes('router.get("/public/:slug"'), true);
  assert.equal(source.includes('router.get("/"'), true);
  assert.equal(source.includes('router.post("/"'), true);
  assert.equal(source.includes('router.patch("/:id"'), true);
  assert.equal(source.includes('router.delete("/:id"'), true);
});

test("restaurant routes expose public reservation options and request intake before admin auth", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );
  const optionsIndex = source.indexOf('router.get("/public/:id/reservations/options"');
  const requestIndex = source.indexOf('router.post("/public/:id/reservations/requests"');
  const adminAuthIndex = source.indexOf("router.use(requireTenantAdmin)");

  assert.equal(optionsIndex > -1, true);
  assert.equal(requestIndex > -1, true);
  assert.equal(optionsIndex < adminAuthIndex, true);
  assert.equal(requestIndex < adminAuthIndex, true);
  assert.equal(source.includes("shapePublicReservationOptions"), true);
  assert.equal(source.includes("buildReservationAutopilot"), true);
  assert.equal(source.includes("RestaurantReservationRequest.create"), true);
});

test("restaurant routes expose public reservation checkout endpoint", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(
    source.includes('router.get("/public/:restaurantId/reservations/:reservationId/checkout"'),
    true
  );
});

test("restaurant routes expose public and admin menu endpoints", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );
  const publicMenuIndex = source.indexOf('router.get("/public/:id/menu"');
  const adminAuthIndex = source.indexOf("router.use(requireTenantAdmin)");

  assert.equal(publicMenuIndex > -1, true);
  assert.equal(publicMenuIndex < adminAuthIndex, true);
  assert.equal(source.includes('router.get("/:restaurantId/menu"'), true);
  assert.equal(source.includes('router.post("/:restaurantId/menu/sections"'), true);
  assert.equal(source.includes('router.post("/:restaurantId/menu/items"'), true);
  assert.equal(source.includes("shapePublicRestaurantMenuPreview"), true);
});

test("restaurant routes expose tenant-admin reservation operations", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.get("/:id/reservations"'), true);
  assert.equal(source.includes('router.post("/:id/service-windows"'), true);
  assert.equal(source.includes('router.patch("/service-windows/:id"'), true);
  assert.equal(source.includes('router.post("/:id/table-types"'), true);
  assert.equal(source.includes('router.patch("/table-types/:id"'), true);
  assert.equal(source.includes('router.post("/:id/availability"'), true);
  assert.equal(source.includes('router.patch("/availability/:id"'), true);
  assert.equal(source.includes('router.patch("/reservation-requests/:id"'), true);
});

test("restaurant routes expose admin menu section and item edit/delete endpoints", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.patch("/menu-sections/:id"'), true);
  assert.equal(source.includes('router.delete("/menu-sections/:id"'), true);
  assert.equal(source.includes('router.patch("/menu-items/:id"'), true);
  assert.equal(source.includes('router.delete("/menu-items/:id"'), true);
  assert.equal(source.includes("RestaurantMenuItem.updateMany"), true);
});

test("restaurant routes expose tenant-admin dining checkout operations", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.patch("/:id/checkout-settings"'), true);
  assert.equal(source.includes('router.post("/reservation-requests/:id/payment-request"'), true);
  assert.equal(source.includes("buildRestaurantPaymentTransactionPayload"), true);
  assert.equal(source.includes("PaymentTransaction.create"), true);
  assert.equal(source.includes("buildReservationPaymentUpdate"), true);
});

test("restaurant client API exports public claim search and intake helpers", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../../src/services/api.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes("export const searchRestaurantClaimListings = (params = {}) =>"), true);
  assert.equal(source.includes('cachedGet("/restaurants/public/claim-search", { params })'), true);
  assert.equal(source.includes("export const submitRestaurantClaimRequest = (data) =>"), true);
  assert.equal(source.includes('API.post("/restaurants/public/claims", data)'), true);
});

test("restaurant client API exports reservation helpers", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../../src/services/api.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes("export const fetchRestaurantReservationOptions = (restaurantId) =>"), true);
  assert.equal(source.includes("/restaurants/public/${restaurantId}/reservations/options"), true);
  assert.equal(source.includes("export const submitRestaurantReservationRequest = (restaurantId, data) =>"), true);
  assert.equal(source.includes("/restaurants/public/${restaurantId}/reservations/requests"), true);
  assert.equal(source.includes("export const fetchRestaurantReservationOperations = (restaurantId) =>"), true);
  assert.equal(source.includes("export const updateRestaurantReservationRequest = (id, data) =>"), true);
});
