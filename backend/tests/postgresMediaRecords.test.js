import test from "node:test";
import assert from "node:assert/strict";

import { buildMediaAssetUpsert } from "../utils/postgresMediaRecords.js";

test("buildMediaAssetUpsert targets media_asset_records", () => {
  const statement = buildMediaAssetUpsert({
    _id: "media-1",
    tenantId: "tenant-1",
    filename: "hero.jpg",
    storageProvider: "mongo-inline",
    size: 2048,
  });

  assert.equal(statement.text.includes("media_asset_records"), true);
  assert.equal(statement.values[0], "media-1");
  assert.equal(statement.values[2], "hero.jpg");
});
