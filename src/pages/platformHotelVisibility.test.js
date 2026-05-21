import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("platform home links directly to hotel marketplace discovery", async () => {
  const source = await readFile(new URL("./PlatformHome.jsx", import.meta.url), "utf8");

  assert.equal(source.includes('to="/discover/hotels"'), true);
  assert.equal(source.includes("Browse Hotels"), true);
});

test("global discovery page surfaces hotels as a marketplace category", async () => {
  const source = await readFile(new URL("./GlobalDiscovery.jsx", import.meta.url), "utf8");

  assert.equal(source.includes('to="/discover/hotels"'), true);
  assert.equal(source.includes("Hotel stays"), true);
});
