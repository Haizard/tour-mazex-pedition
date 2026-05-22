import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("AppProviders wraps public app with traveler auth provider", async () => {
  const source = await readFile(new URL("../../AppProviders.jsx", import.meta.url), "utf8");

  assert.equal(source.includes("TravelerAuthProvider"), true);
});

test("Navbar exposes traveler account state and logout", async () => {
  const source = await readFile(new URL("./Navbar.jsx", import.meta.url), "utf8");

  assert.equal(source.includes("useTravelerAuth"), true);
  assert.equal(source.includes("travelerProfileLabel"), true);
  assert.equal(source.includes("logout"), true);
});

test("ResponsiveMenu receives traveler identity controls for mobile", async () => {
  const source = await readFile(new URL("./ResponsiveMenu.jsx", import.meta.url), "utf8");

  assert.equal(source.includes("travelerProfileLabel"), true);
  assert.equal(source.includes("onTravelerLogout"), true);
});
