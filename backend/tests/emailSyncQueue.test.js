import test from "node:test";
import assert from "node:assert/strict";

import {
  EMAIL_SYNC_DISPATCH_DEDUPE_PREFIX,
  buildEmailSyncDispatchDedupeKey,
  buildEmailSyncDispatchJob,
  processQueuedEmailSyncJob,
  drainEmailSyncDispatchQueue,
} from "../utils/emailSyncQueue.js";

test("buildEmailSyncDispatchJob normalizes job identifiers", () => {
  const job = buildEmailSyncDispatchJob({
    jobId: 41,
    tenantId: 9,
    connectionId: 77,
  });

  assert.deepEqual(job, {
    jobId: "41",
    tenantId: "9",
    connectionId: "77",
  });
});

test("buildEmailSyncDispatchDedupeKey uses the sync job id", () => {
  const key = buildEmailSyncDispatchDedupeKey({ jobId: "job_1" });

  assert.equal(key, `${EMAIL_SYNC_DISPATCH_DEDUPE_PREFIX}:job_1`);
});

test("processQueuedEmailSyncJob marks jobs completed when the scaffold can run", async () => {
  const syncJob = {
    status: "queued",
    startedAt: null,
    completedAt: null,
    resultSummary: "",
    recordsDiscovered: 0,
    recordsProcessed: 0,
    errorMessage: "",
    metadata: {},
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
    },
  };

  const connection = {
    provider: "gmail",
    connectionType: "inbox",
    metadata: {
      healthCheck: {
        ok: true,
      },
    },
  };

  const result = await processQueuedEmailSyncJob({
    job: buildEmailSyncDispatchJob({
      jobId: "job_1",
      tenantId: "tenant_1",
      connectionId: "conn_1",
    }),
    loadSyncJob: async () => syncJob,
    loadConnection: async () => connection,
  });

  assert.equal(result.changed, true);
  assert.equal(result.failed, false);
  assert.equal(syncJob.status, "completed");
  assert.equal(syncJob.recordsDiscovered, 6);
  assert.equal(syncJob.recordsProcessed, 4);
  assert.equal(syncJob.errorMessage, "");
  assert.equal(syncJob.metadata.simulated, true);
  assert.equal(syncJob.saveCalls, 2);
});

test("processQueuedEmailSyncJob marks jobs failed when the connection is missing", async () => {
  const syncJob = {
    status: "queued",
    metadata: {},
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
    },
  };

  const result = await processQueuedEmailSyncJob({
    job: buildEmailSyncDispatchJob({
      jobId: "job_1",
      tenantId: "tenant_1",
      connectionId: "conn_1",
    }),
    loadSyncJob: async () => syncJob,
    loadConnection: async () => null,
  });

  assert.equal(result.changed, true);
  assert.equal(result.failed, true);
  assert.equal(syncJob.status, "failed");
  assert.equal(syncJob.errorMessage.includes("Connection not found"), true);
  assert.equal(syncJob.saveCalls, 2);
});

test("drainEmailSyncDispatchQueue summarizes queued email sync work", async () => {
  const jobs = [
    buildEmailSyncDispatchJob({ jobId: "job_1", tenantId: "tenant_1", connectionId: "conn_1" }),
    buildEmailSyncDispatchJob({ jobId: "job_2", tenantId: "tenant_1", connectionId: "conn_2" }),
  ];

  const syncJobs = new Map([
    ["job_1", {
      status: "queued",
      metadata: {},
      async save() {},
    }],
    ["job_2", {
      status: "queued",
      metadata: {},
      async save() {},
    }],
  ]);

  const summary = await drainEmailSyncDispatchQueue({
    dequeueJob: async () => jobs.shift() || null,
    loadSyncJob: async (job) => syncJobs.get(job.jobId) || null,
    loadConnection: async () => ({
      provider: "gmail",
      connectionType: "inbox",
      metadata: { healthCheck: { ok: true } },
    }),
  });

  assert.deepEqual(summary, {
    attempted: 2,
    processed: 2,
    failed: 0,
    remaining: false,
  });
});
