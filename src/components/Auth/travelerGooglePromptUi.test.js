import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("TravelerGooglePrompt renders as a top-right soft Google sign-in prompt", async () => {
  const source = await readFile(new URL("./TravelerGooglePrompt.jsx", import.meta.url), "utf8");

  assert.equal(source.includes("fixed right-4 top-24"), true);
  assert.equal(source.includes("Continue with Google"), true);
  assert.equal(source.includes("Not now"), true);
  assert.equal(source.includes("buildTravelerGoogleAuthUrl"), true);
});
