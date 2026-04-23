import assert from "node:assert/strict";
import { createGetRequestCache } from "../src/services/apiCache.js";

const testInFlightDedupesConcurrentRequests = async () => {
  let calls = 0;
  const cache = createGetRequestCache({ ttlMs: 1000, now: () => 100 });

  const first = cache.get("tenant:/api/tours", async () => {
    calls += 1;
    return { data: ["serengeti"] };
  });
  const second = cache.get("tenant:/api/tours", async () => {
    calls += 1;
    return { data: ["duplicate"] };
  });

  assert.equal(first, second);
  assert.deepEqual(await first, { data: ["serengeti"] });
  assert.equal(calls, 1);
};

const testFreshCachedResponseIsReused = async () => {
  let now = 100;
  let calls = 0;
  const cache = createGetRequestCache({ ttlMs: 1000, now: () => now });

  const first = await cache.get("tenant:/api/blogs", async () => {
    calls += 1;
    return { data: ["first"] };
  });

  now = 500;
  const second = await cache.get("tenant:/api/blogs", async () => {
    calls += 1;
    return { data: ["second"] };
  });

  assert.equal(calls, 1);
  assert.equal(first, second);
  assert.deepEqual(second, { data: ["first"] });
};

const testExpiredCachedResponseRefetches = async () => {
  let now = 100;
  let calls = 0;
  const cache = createGetRequestCache({ ttlMs: 1000, now: () => now });

  await cache.get("tenant:/api/site-settings", async () => {
    calls += 1;
    return { data: "old" };
  });

  now = 1200;
  const response = await cache.get("tenant:/api/site-settings", async () => {
    calls += 1;
    return { data: "new" };
  });

  assert.equal(calls, 2);
  assert.deepEqual(response, { data: "new" });
};

const testFailuresAreNotCached = async () => {
  let calls = 0;
  const cache = createGetRequestCache({ ttlMs: 1000, now: () => 100 });

  await assert.rejects(
    cache.get("tenant:/api/menu-items", async () => {
      calls += 1;
      throw new Error("network down");
    }),
    /network down/
  );

  const response = await cache.get("tenant:/api/menu-items", async () => {
    calls += 1;
    return { data: [] };
  });

  assert.equal(calls, 2);
  assert.deepEqual(response, { data: [] });
};

const testClearInvalidatesCache = async () => {
  let calls = 0;
  const cache = createGetRequestCache({ ttlMs: 1000, now: () => 100 });

  await cache.get("tenant:/api/taxonomies", async () => {
    calls += 1;
    return { data: ["old"] };
  });

  cache.clear();

  const response = await cache.get("tenant:/api/taxonomies", async () => {
    calls += 1;
    return { data: ["new"] };
  });

  assert.equal(calls, 2);
  assert.deepEqual(response, { data: ["new"] });
};

await testInFlightDedupesConcurrentRequests();
await testFreshCachedResponseIsReused();
await testExpiredCachedResponseRefetches();
await testFailuresAreNotCached();
await testClearInvalidatesCache();

console.log("api cache tests passed");
