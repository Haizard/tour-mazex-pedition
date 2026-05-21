import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("api service exposes tenant-admin hotel partner onboarding call", async () => {
  const source = await readFile(new URL("./api.js", import.meta.url), "utf8");

  assert.equal(source.includes("createHotelPartnerAdmin"), true);
  assert.equal(source.includes('API.post(`/hotels/${id}/partner-admins`, data)'), true);
});
