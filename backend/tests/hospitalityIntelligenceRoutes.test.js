import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("discovery routes expose hospitality recommendations from marketplace sources", async () => {
  const source = await readFile(
    new URL("../routes/discoveryRoutes.js", import.meta.url),
    "utf8"
  );

  assert.equal(source.includes('router.get("/hospitality/recommendations"'), true);
  assert.equal(source.includes("buildHospitalityRecommendations"), true);
  assert.equal(source.includes("Hotel.find"), true);
  assert.equal(source.includes("Restaurant.find"), true);
});
