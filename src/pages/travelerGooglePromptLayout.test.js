import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Layout schedules the traveler Google prompt on public platform pages", async () => {
  const source = await readFile(new URL("./Layout.jsx", import.meta.url), "utf8");

  assert.equal(source.includes("TravelerGooglePrompt"), true);
  assert.equal(source.includes("TRAVELER_GOOGLE_PROMPT_DELAY_MS"), true);
  assert.equal(source.includes("shouldScheduleTravelerGooglePrompt"), true);
});
