import test from "node:test";
import assert from "node:assert/strict";

import { safePrimaryLookup } from "../utils/safePrimaryLookup.js";

test("safePrimaryLookup returns lookup value when primary read succeeds", async () => {
  const result = await safePrimaryLookup(async () => ({ _id: "pg-1" }));
  assert.deepEqual(result, { _id: "pg-1" });
});

test("safePrimaryLookup returns null when primary read throws", async () => {
  const result = await safePrimaryLookup(async () => {
    throw new Error("lookup failed");
  });

  assert.equal(result, null);
});

test("safePrimaryLookup reports lookup failures through onError", async () => {
  let capturedMessage = "";

  await safePrimaryLookup(
    async () => {
      throw new Error("lookup failed");
    },
    {
      onError: (error) => {
        capturedMessage = error.message;
      },
    }
  );

  assert.equal(capturedMessage, "lookup failed");
});
