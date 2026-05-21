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
