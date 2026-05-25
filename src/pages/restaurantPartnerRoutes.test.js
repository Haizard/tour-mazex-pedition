import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("AppRoutes exposes restaurant claim and restaurant partner routes", async () => {
  const source = await fs.readFile(new URL("../AppRoutes.jsx", import.meta.url), "utf8");

  assert.equal(source.includes('import("./pages/RestaurantClaimPage")'), true);
  assert.equal(source.includes('import("./pages/RestaurantPartnerLogin")'), true);
  assert.equal(source.includes('import("./pages/RestaurantPartnerDashboard")'), true);
  assert.equal(source.includes('path="discover/restaurants/claim"'), true);
  assert.equal(source.includes('path="restaurant-partner/login"'), true);
  assert.equal(source.includes('path="restaurant-partner"'), true);
});
