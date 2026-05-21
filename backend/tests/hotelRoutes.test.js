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
