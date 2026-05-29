import test from "node:test";
import assert from "node:assert/strict";

import { processQueuedPlatformOutreachNow } from "../utils/platformOutreachProcessingLoop.js";

test("processQueuedPlatformOutreachNow returns an empty summary when Redis is unavailable", async () => {
  const summary = await processQueuedPlatformOutreachNow({
    getRedisClient: async () => null,
  });

  assert.deepEqual(summary, {
    queued: 0,
    attempted: 0,
    processed: 0,
    failed: 0,
    remaining: false,
  });
});

test("processQueuedPlatformOutreachNow queues due work before draining dispatch jobs", async () => {
  const calls = [];
  const redisClient = {
    async set() {
      return "OK";
    },
    async lPush() {},
    async del() {},
  };

  const summary = await processQueuedPlatformOutreachNow({
    getRedisClient: async () => redisClient,
    queueDueDispatches: async ({ enqueueJob }) => {
      await enqueueJob({ type: "message", messageId: "message-1", socialPostId: "" });
      calls.push("queue");
      return { enqueuedCount: 1 };
    },
    drainQueue: async () => {
      calls.push("drain");
      return { attempted: 1, processed: 1, failed: 0, remaining: false };
    },
  });

  assert.deepEqual(calls, ["queue", "drain"]);
  assert.deepEqual(summary, {
    queued: 1,
    attempted: 1,
    processed: 1,
    failed: 0,
    remaining: false,
  });
});

test("processQueuedPlatformOutreachNow wires live provider dispatch callbacks into the queue drain", async () => {
  const redisClient = {
    async set() {
      return "OK";
    },
    async lPush() {},
    async del() {},
  };
  let drainOptions = null;

  await processQueuedPlatformOutreachNow({
    getRedisClient: async () => redisClient,
    queueDueDispatches: async () => ({ enqueuedCount: 0 }),
    drainQueue: async (options) => {
      drainOptions = options;
      return { attempted: 0, processed: 0, failed: 0, remaining: false };
    },
  });

  assert.equal(typeof drainOptions.sendMessage, "function");
  assert.equal(typeof drainOptions.publishSocialPost, "function");
  assert.equal(typeof drainOptions.loadSettings, "function");
});
