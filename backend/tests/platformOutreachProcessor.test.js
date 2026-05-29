import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlatformOutreachDispatchJob,
  drainPlatformOutreachDispatchQueue,
  processQueuedPlatformOutreachJob,
  queueDuePlatformOutreachDispatches,
} from "../utils/platformOutreachProcessor.js";

const createSavable = (data) => ({
  ...data,
  saveCalls: 0,
  async save() {
    this.saveCalls += 1;
    return this;
  },
});

test("buildPlatformOutreachDispatchJob creates stable message and social jobs", () => {
  assert.deepEqual(buildPlatformOutreachDispatchJob({ messageId: "m1" }), {
    type: "message",
    messageId: "m1",
    socialPostId: "",
  });
  assert.deepEqual(buildPlatformOutreachDispatchJob({ socialPostId: "s1" }), {
    type: "social-post",
    messageId: "",
    socialPostId: "s1",
  });
});

test("queueDuePlatformOutreachDispatches enqueues due queued messages and scheduled posts", async () => {
  const enqueued = [];
  const now = new Date("2026-05-28T10:00:00.000Z");
  const result = await queueDuePlatformOutreachDispatches({
    now,
    loadDueMessages: async () => [
      { _id: "message-1", status: "queued", scheduledFor: new Date("2026-05-28T09:00:00.000Z") },
    ],
    loadDueSocialPosts: async () => [
      { _id: "post-1", status: "scheduled", scheduledFor: new Date("2026-05-28T09:30:00.000Z") },
    ],
    markQueued: async () => true,
    enqueueJob: async (job) => enqueued.push(job),
  });

  assert.equal(result.enqueuedCount, 2);
  assert.deepEqual(enqueued, [
    { type: "message", messageId: "message-1", socialPostId: "" },
    { type: "social-post", messageId: "", socialPostId: "post-1" },
  ]);
});

test("processQueuedPlatformOutreachJob sends a compliant outreach message", async () => {
  const message = createSavable({
    _id: "message-1",
    status: "queued",
    channel: "email",
    prospectId: "prospect-1",
    body: "Hello",
    providerMessageId: "",
    providerError: "",
  });
  const events = [];

  const result = await processQueuedPlatformOutreachJob({
    job: { type: "message", messageId: "message-1" },
    now: new Date("2026-05-28T10:00:00.000Z"),
    loadMessage: async () => message,
    loadProspect: async () => ({ _id: "prospect-1", email: "sales@example.com" }),
    loadSettings: async () => ({ email: { senderEmail: "hello@mazex.com", senderName: "Mazex", unsubscribeUrl: "https://mazex.test/unsubscribe" } }),
    resolveReadiness: () => ({ ready: true, missing: [] }),
    sendMessage: async () => ({ providerMessageId: "provider-1" }),
    recordEvent: async (event) => events.push(event),
  });

  assert.deepEqual(result, { changed: true, failed: false, missing: false });
  assert.equal(message.status, "sent");
  assert.equal(message.providerMessageId, "provider-1");
  assert.equal(message.saveCalls, 1);
  assert.equal(events[0].eventType, "message_sent");
});

test("processQueuedPlatformOutreachJob fails safely when readiness is missing", async () => {
  const message = createSavable({
    _id: "message-1",
    status: "queued",
    channel: "email",
    prospectId: "prospect-1",
    body: "Hello",
    providerError: "",
  });

  const result = await processQueuedPlatformOutreachJob({
    job: { type: "message", messageId: "message-1" },
    loadMessage: async () => message,
    loadProspect: async () => ({ _id: "prospect-1", email: "sales@example.com" }),
    loadSettings: async () => ({}),
    resolveReadiness: () => ({ ready: false, missing: ["sender email"] }),
    recordEvent: async () => {},
  });

  assert.equal(result.failed, true);
  assert.equal(message.status, "failed");
  assert.match(message.providerError, /sender email/i);
});

test("processQueuedPlatformOutreachJob publishes a due platform social post", async () => {
  const post = createSavable({
    _id: "post-1",
    status: "scheduled",
    title: "Launch",
    platforms: ["facebook"],
    publishResult: null,
    lastError: "",
  });

  const result = await processQueuedPlatformOutreachJob({
    job: { type: "social-post", socialPostId: "post-1" },
    loadSocialPost: async () => post,
    publishSocialPost: async () => ({ facebook: { id: "fb-1" } }),
    recordEvent: async () => {},
  });

  assert.deepEqual(result, { changed: true, failed: false, missing: false });
  assert.equal(post.status, "published");
  assert.deepEqual(post.publishResult, { facebook: { id: "fb-1" } });
  assert.equal(post.saveCalls, 1);
});

test("drainPlatformOutreachDispatchQueue summarizes queued work", async () => {
  const jobs = [{ type: "message", messageId: "missing-message" }];
  const result = await drainPlatformOutreachDispatchQueue({
    dequeueJob: async () => jobs.shift() || null,
    loadMessage: async () => null,
  });

  assert.equal(result.attempted, 1);
  assert.equal(result.failed, 1);
  assert.equal(result.remaining, false);
});
