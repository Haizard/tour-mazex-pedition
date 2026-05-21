import test from "node:test";
import assert from "node:assert/strict";

test("hotelRoutes exports an Express router", async () => {
  const module = await import("../routes/hotelRoutes.js");

  assert.equal(typeof module.default, "function");
  assert.equal(typeof module.default.use, "function");
});

test("server registers hotel routes", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../server.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('from "./routes/hotelRoutes.js"'), true);
  assert.equal(source.includes('app.use("/api/hotels", hotelRoutes)'), true);
});

test("hotel routes include tenant-admin partner account onboarding", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/hotelRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.post("/:id/partner-admins"'), true);
  assert.equal(source.includes("HotelPartnerAdmin.create"), true);
});

test("hotel routes include tenant-admin partner profile approval workflow", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/hotelRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.post("/:id/partner-profile-review"'), true);
  assert.equal(source.includes("pendingPartnerUpdate"), true);
  assert.equal(source.includes("updatePostgresFirstHotel"), true);
});

test("hotel routes include public AI concierge recommendations before admin auth", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/hotelRoutes.js", import.meta.url), "utf8")
  );
  const conciergeIndex = source.indexOf('router.post("/public/concierge/recommendations"');
  const adminAuthIndex = source.indexOf("router.use(requireTenantAdmin)");

  assert.equal(conciergeIndex > -1, true);
  assert.equal(conciergeIndex < adminAuthIndex, true);
  assert.equal(source.includes("buildHotelConciergeRecommendations"), true);
});
