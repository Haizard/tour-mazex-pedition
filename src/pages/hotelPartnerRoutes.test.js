import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("AppRoutes exposes separate hotel partner login and dashboard routes", async () => {
  const source = await readFile(new URL("../AppRoutes.jsx", import.meta.url), "utf8");

  assert.equal(source.includes("HotelPartnerLogin"), true);
  assert.equal(source.includes("HotelPartnerDashboard"), true);
  assert.equal(source.includes('path="hotel-partner/login"'), true);
  assert.equal(source.includes('path="hotel-partner"'), true);
});
