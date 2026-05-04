import test from "node:test";
import assert from "node:assert/strict";

import {
  SOCIAL_POST_DISPATCH_DEDUPE_PREFIX,
  buildSocialPostDispatchDedupeKey,
  buildSocialPostDispatchJob,
  processQueuedSocialPost,
  drainSocialPostDispatchQueue,
} from "../utils/socialPostQueue.js";

test("buildSocialPostDispatchJob normalizes scheduled social jobs", () => {
  const job = buildSocialPostDispatchJob({
    postId: 42,
    tenantId: 7,
  });

  assert.deepEqual(job, {
    postId: "42",
    tenantId: "7",
  });
});

test("buildSocialPostDispatchDedupeKey uses the post id", () => {
  const key = buildSocialPostDispatchDedupeKey({ postId: "post_1" });

  assert.equal(key, `${SOCIAL_POST_DISPATCH_DEDUPE_PREFIX}:post_1`);
});

test("processQueuedSocialPost publishes scheduled posts and clears errors", async () => {
  const post = {
    title: "Migration Story",
    status: "scheduled",
    lastError: "old failure",
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
    },
  };

  const result = await processQueuedSocialPost({
    job: buildSocialPostDispatchJob({ postId: "post_1", tenantId: "tenant_1" }),
    loadPost: async () => post,
    loadMetaAccount: async () => ({ provider: "meta" }),
    publishPost: async () => ({ facebook: { id: "fb_1" } }),
  });

  assert.equal(result.changed, true);
  assert.equal(result.failed, false);
  assert.equal(post.status, "published");
  assert.deepEqual(post.publishResult, { facebook: { id: "fb_1" } });
  assert.equal(post.lastError, "");
  assert.equal(post.saveCalls, 1);
});

test("processQueuedSocialPost marks failures on publishing errors", async () => {
  const post = {
    title: "Migration Story",
    status: "scheduled",
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
    },
  };

  const result = await processQueuedSocialPost({
    job: buildSocialPostDispatchJob({ postId: "post_1", tenantId: "tenant_1" }),
    loadPost: async () => post,
    loadMetaAccount: async () => ({ provider: "meta" }),
    publishPost: async () => {
      throw new Error("Meta publishing failed");
    },
  });

  assert.equal(result.changed, true);
  assert.equal(result.failed, true);
  assert.equal(post.status, "failed");
  assert.equal(post.lastError, "Meta publishing failed");
  assert.equal(post.saveCalls, 1);
});

test("drainSocialPostDispatchQueue summarizes processed results", async () => {
  const jobs = [
    buildSocialPostDispatchJob({ postId: "post_1", tenantId: "tenant_1" }),
    buildSocialPostDispatchJob({ postId: "post_2", tenantId: "tenant_1" }),
  ];

  const posts = new Map([
    ["post_1", {
      title: "First",
      status: "scheduled",
      async save() {},
    }],
    ["post_2", {
      title: "Second",
      status: "scheduled",
      async save() {},
    }],
  ]);

  const summary = await drainSocialPostDispatchQueue({
    dequeueJob: async () => jobs.shift() || null,
    loadPost: async (job) => posts.get(job.postId) || null,
    loadMetaAccount: async () => ({ provider: "meta" }),
    publishPost: async () => ({ facebook: { id: "fb_1" } }),
  });

  assert.deepEqual(summary, {
    attempted: 2,
    processed: 2,
    failed: 0,
    remaining: false,
  });
});
