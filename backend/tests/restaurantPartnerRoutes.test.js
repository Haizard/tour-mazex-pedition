import test from "node:test";
import assert from "node:assert/strict";

test("restaurant partner auth routes export an Express router", async () => {
  const authRoutes = await import("../routes/restaurantPartnerAuthRoutes.js");

  assert.equal(typeof authRoutes.default, "function");
  assert.equal(typeof authRoutes.default.use, "function");
});

test("server registers restaurant partner auth routes", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../server.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('from "./routes/restaurantPartnerAuthRoutes.js"'), true);
  assert.equal(
    source.includes('app.use("/api/restaurant-partner-auth", restaurantPartnerAuthRoutes)'),
    true
  );
});

test("restaurant partner auth routes expose login and session lookup", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantPartnerAuthRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.post("/login"'), true);
  assert.equal(source.includes('router.get("/me"'), true);
  assert.equal(source.includes("RestaurantPartnerAdmin.findOne"), true);
  assert.equal(source.includes("signRestaurantPartnerToken"), true);
  assert.equal(source.includes("requireRestaurantPartnerAdmin"), true);
});

test("restaurant partner auth routes expose reservation operations for assigned restaurants", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantPartnerAuthRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.get("/restaurants"'), true);
  assert.equal(source.includes('router.get("/restaurants/:restaurantId/reservations"'), true);
  assert.equal(source.includes('router.post("/restaurants/:restaurantId/service-windows"'), true);
  assert.equal(source.includes('router.patch("/service-windows/:id"'), true);
  assert.equal(source.includes('router.post("/restaurants/:restaurantId/table-types"'), true);
  assert.equal(source.includes('router.patch("/table-types/:id"'), true);
  assert.equal(source.includes('router.post("/restaurants/:restaurantId/availability"'), true);
  assert.equal(source.includes('router.patch("/availability/:id"'), true);
  assert.equal(source.includes('router.patch("/reservation-requests/:id"'), true);
  assert.equal(source.includes("assertPartnerRestaurantAccess"), true);
});

test("restaurant partner auth routes expose menu section and item edit/delete endpoints", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantPartnerAuthRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.patch("/menu-sections/:id"'), true);
  assert.equal(source.includes('router.delete("/menu-sections/:id"'), true);
  assert.equal(source.includes('router.patch("/menu-items/:id"'), true);
  assert.equal(source.includes('router.delete("/menu-items/:id"'), true);
  assert.equal(source.includes("assertPartnerRestaurantAccess"), true);
  assert.equal(source.includes("RestaurantMenuItem.updateMany"), true);
});

test("restaurant partner auth routes expose menu management endpoints", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantPartnerAuthRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.get("/restaurants/:restaurantId/menu"'), true);
  assert.equal(source.includes('router.post("/restaurants/:restaurantId/menu/sections"'), true);
  assert.equal(source.includes('router.post("/restaurants/:restaurantId/menu/items"'), true);
  assert.equal(source.includes("assertPartnerRestaurantAccess"), true);
});

test("restaurant partner auth routes expose dining checkout operations", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantPartnerAuthRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.patch("/restaurants/:restaurantId/checkout-settings"'), true);
  assert.equal(source.includes('router.post("/reservation-requests/:id/payment-request"'), true);
  assert.equal(source.includes("buildRestaurantPaymentTransactionPayload"), true);
  assert.equal(source.includes("PaymentTransaction.create"), true);
  assert.equal(source.includes("buildReservationPaymentUpdate"), true);
});

test("restaurant partner auth middleware validates tenant-scoped restaurant partner sessions", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../middleware/restaurantPartnerAuthMiddleware.js", import.meta.url),
      "utf8"
    )
  );

  assert.equal(source.includes("verifyRestaurantPartnerToken"), true);
  assert.equal(source.includes("RestaurantPartnerAdmin.findOne"), true);
  assert.equal(source.includes("restaurant partner"), true);
});
