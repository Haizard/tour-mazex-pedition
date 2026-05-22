import test from "node:test";
import assert from "node:assert/strict";

test("hotel partner auth and portal routes export Express routers", async () => {
  const [authRoutes, portalRoutes] = await Promise.all([
    import("../routes/hotelPartnerAuthRoutes.js"),
    import("../routes/hotelPartnerPortalRoutes.js"),
  ]);

  assert.equal(typeof authRoutes.default, "function");
  assert.equal(typeof authRoutes.default.use, "function");
  assert.equal(typeof portalRoutes.default, "function");
  assert.equal(typeof portalRoutes.default.use, "function");
});

test("server registers hotel partner auth and portal routes", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../server.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('from "./routes/hotelPartnerAuthRoutes.js"'), true);
  assert.equal(source.includes('from "./routes/hotelPartnerPortalRoutes.js"'), true);
  assert.equal(source.includes('app.use("/api/hotel-partner-auth", hotelPartnerAuthRoutes)'), true);
  assert.equal(source.includes('app.use("/api/hotel-partner", hotelPartnerPortalRoutes)'), true);
});

test("hotel partner portal routes expose scoped accommodation request handling", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/hotelPartnerPortalRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.get("/accommodation-requests"'), true);
  assert.equal(source.includes('router.patch("/accommodation-requests/:id"'), true);
  assert.equal(source.includes("canHotelPartnerManageAccommodationRequest"), true);
  assert.equal(source.includes("buildHotelPartnerAccommodationResponseUpdate"), true);
});

test("hotel partner hotel updates are submitted for tourism admin approval", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/hotelPartnerPortalRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes("buildHotelPartnerPendingProfileUpdate"), true);
  assert.equal(source.includes("pendingPartnerUpdate"), true);
  assert.equal(source.includes("updatePostgresFirstHotel(req.params.id"), false);
});

test("hotel partner portal routes expose hotel inventory editing endpoints", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/hotelPartnerPortalRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.get("/hotels/:id/inventory"'), true);
  assert.equal(source.includes('router.patch("/hotels/:id/inventory"'), true);
  assert.equal(source.includes("normalizeHotelInventoryPayload"), true);
  assert.equal(source.includes("normalizeHotelAvailabilityEntries"), true);
});

test("hotel partner portal routes expose channel settings and sync endpoints", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/hotelPartnerPortalRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.get("/hotels/:id/channels"'), true);
  assert.equal(source.includes('router.patch("/hotels/:id/channels"'), true);
  assert.equal(source.includes('router.post("/hotels/:id/channels/sync"'), true);
  assert.equal(source.includes("buildHotelChannelSyncResult"), true);
});
