import test from "node:test";
import assert from "node:assert/strict";

import { isMongoDuplicateKeyError, withDuplicateKeyRetry } from "../utils/mongoWriteRetry.js";

test("isMongoDuplicateKeyError detects mongo duplicate key failures", () => {
  assert.equal(isMongoDuplicateKeyError({ code: 11000 }), true);
  assert.equal(isMongoDuplicateKeyError({ message: "E11000 duplicate key error collection: demo" }), true);
  assert.equal(isMongoDuplicateKeyError({ code: 500, message: "other" }), false);
});

test("withDuplicateKeyRetry falls back when the primary operation hits a duplicate key", async () => {
  const result = await withDuplicateKeyRetry(
    async () => {
      throw new Error("E11000 duplicate key error collection: demo");
    },
    async () => "recovered"
  );

  assert.equal(result, "recovered");
});
