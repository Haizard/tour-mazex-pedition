import test from "node:test";
import assert from "node:assert/strict";

import {
  acquireFollowUpProcessingLock,
  buildFollowUpDispatchJob,
  drainFollowUpDispatchQueue,
  processDueTouchpoints,
  queueDueTouchpoints,
  releaseFollowUpProcessingLock,
} from "../utils/followUpProcessor.js";

test("processDueTouchpoints marks due whatsapp touchpoints as sent when delivery succeeds", async () => {
  const now = new Date("2026-04-29T12:00:00.000Z");
  const sequence = {
    inquiryId: { phone: "+255700000000" },
    touchpoints: [
      {
        scheduledAt: new Date("2026-04-29T11:00:00.000Z"),
        channel: "whatsapp",
        content: "Checking back in",
        status: "pending",
        sentAt: null,
      },
    ],
  };

  const sentMessages = [];
  const result = await processDueTouchpoints({
    sequence,
    now,
    sendWhatsAppMessage: async ({ phone, message }) => {
      sentMessages.push({ phone, message });
    },
  });

  assert.equal(result.changed, true);
  assert.equal(sequence.touchpoints[0].status, "sent");
  assert.ok(sequence.touchpoints[0].sentAt instanceof Date);
  assert.deepEqual(sentMessages, [{ phone: "+255700000000", message: "Checking back in" }]);
});

test("processDueTouchpoints marks due touchpoints failed when delivery throws", async () => {
  const now = new Date("2026-04-29T12:00:00.000Z");
  const sequence = {
    inquiryId: { phone: "+255700000000" },
    touchpoints: [
      {
        scheduledAt: new Date("2026-04-29T11:00:00.000Z"),
        channel: "whatsapp",
        content: "Checking back in",
        status: "pending",
        sentAt: null,
      },
    ],
  };

  const result = await processDueTouchpoints({
    sequence,
    now,
    sendWhatsAppMessage: async () => {
      throw new Error("delivery failed");
    },
  });

  assert.equal(result.changed, true);
  assert.equal(sequence.touchpoints[0].status, "failed");
  assert.equal(sequence.touchpoints[0].sentAt, null);
});

test("processDueTouchpoints ignores future or non-pending touchpoints", async () => {
  const now = new Date("2026-04-29T12:00:00.000Z");
  const sequence = {
    inquiryId: { phone: "+255700000000" },
    touchpoints: [
      {
        scheduledAt: new Date("2026-04-30T11:00:00.000Z"),
        channel: "whatsapp",
        content: "Future follow-up",
        status: "pending",
        sentAt: null,
      },
      {
        scheduledAt: new Date("2026-04-29T10:00:00.000Z"),
        channel: "whatsapp",
        content: "Already sent",
        status: "sent",
        sentAt: new Date("2026-04-29T10:05:00.000Z"),
      },
    ],
  };

  let sentCount = 0;
  const result = await processDueTouchpoints({
    sequence,
    now,
    sendWhatsAppMessage: async () => {
      sentCount += 1;
    },
  });

  assert.equal(result.changed, false);
  assert.equal(sentCount, 0);
  assert.equal(sequence.touchpoints[0].status, "pending");
  assert.equal(sequence.touchpoints[1].status, "sent");
});

test("buildFollowUpDispatchJob records sequence and touchpoint identity", () => {
  const job = buildFollowUpDispatchJob({
    sequence: { _id: "sequence-1", tenantId: "tenant-1", inquiryId: { _id: "inquiry-1" } },
    touchpointIndex: 2,
  });

  assert.equal(job.sequenceId, "sequence-1");
  assert.equal(job.tenantId, "tenant-1");
  assert.equal(job.inquiryId, "inquiry-1");
  assert.equal(job.touchpointIndex, 2);
});

test("queueDueTouchpoints enqueues only due pending touchpoints and dedupes them", async () => {
  const now = new Date("2026-04-29T12:00:00.000Z");
  const queued = [];
  const dedupe = new Set();
  const sequence = {
    _id: "sequence-1",
    tenantId: "tenant-1",
    inquiryId: { _id: "inquiry-1", phone: "+255700000000" },
    touchpoints: [
      {
        scheduledAt: new Date("2026-04-29T11:00:00.000Z"),
        channel: "whatsapp",
        content: "Checking back in",
        status: "pending",
      },
      {
        scheduledAt: new Date("2026-04-30T11:00:00.000Z"),
        channel: "whatsapp",
        content: "Future follow-up",
        status: "pending",
      },
      {
        scheduledAt: new Date("2026-04-29T10:00:00.000Z"),
        channel: "whatsapp",
        content: "Already sent",
        status: "sent",
      },
    ],
  };

  const result = await queueDueTouchpoints({
    sequence,
    now,
    enqueueJob: async (job) => {
      queued.push(job);
    },
    markDispatched: async (job) => {
      const key = `${job.sequenceId}:${job.touchpointIndex}`;
      if (dedupe.has(key)) {
        return false;
      }
      dedupe.add(key);
      return true;
    },
  });

  assert.equal(result.enqueuedCount, 1);
  assert.equal(queued.length, 1);
  assert.equal(queued[0].touchpointIndex, 0);
});

test("acquire and release follow-up processing lock use redis semantics", async () => {
  const calls = [];
  const redisClient = {
    set: async (...args) => {
      calls.push(args);
      return "OK";
    },
    del: async (...args) => {
      calls.push(args);
      return 1;
    },
  };

  const acquired = await acquireFollowUpProcessingLock({ redisClient, lockKey: "lock-1", ttlSeconds: 30 });
  await releaseFollowUpProcessingLock({ redisClient, lockKey: "lock-1" });

  assert.equal(acquired, true);
  assert.deepEqual(calls[0], ["lock-1", "1", { NX: true, EX: 30 }]);
  assert.deepEqual(calls[1], ["lock-1"]);
});

test("drainFollowUpDispatchQueue processes queued touchpoints and saves changes", async () => {
  const now = new Date("2026-04-29T12:00:00.000Z");
  const sentMessages = [];
  const saved = [];
  const synced = [];
  const queue = [
    {
      sequenceId: "sequence-1",
      touchpointIndex: 0,
    },
  ];

  const sequence = {
    _id: "sequence-1",
    inquiryId: { phone: "+255700000000" },
    touchpoints: [
      {
        scheduledAt: new Date("2026-04-29T11:00:00.000Z"),
        channel: "whatsapp",
        content: "Checking back in",
        status: "pending",
        sentAt: null,
      },
    ],
    toObject() {
      return {
        _id: this._id,
        inquiryId: this.inquiryId,
        touchpoints: this.touchpoints,
      };
    },
  };

  const summary = await drainFollowUpDispatchQueue({
    now,
    dequeueJob: async () => queue.shift() || null,
    loadSequence: async () => sequence,
    loadChannelContext: async () => ({ phone: "+255700000000" }),
    sendWhatsAppMessage: async ({ phone, message }) => {
      sentMessages.push({ phone, message });
    },
    saveSequence: async (record) => {
      saved.push(record._id);
    },
    syncSequence: async (record) => {
      synced.push(record._id);
    },
  });

  assert.equal(summary.attempted, 1);
  assert.equal(summary.processed, 1);
  assert.equal(summary.failed, 0);
  assert.equal(sequence.touchpoints[0].status, "sent");
  assert.deepEqual(sentMessages, [{ phone: "+255700000000", message: "Checking back in" }]);
  assert.deepEqual(saved, ["sequence-1"]);
  assert.deepEqual(synced, ["sequence-1"]);
});
