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
