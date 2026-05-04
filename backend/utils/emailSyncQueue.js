import { buildSyncJobSnapshot } from "./emailProviderService.js";

export const EMAIL_SYNC_DISPATCH_QUEUE_KEY = "email_sync_dispatch_jobs";
export const EMAIL_SYNC_DISPATCH_LOCK_KEY = "email_sync_dispatch_lock";
export const EMAIL_SYNC_DISPATCH_DEDUPE_PREFIX = "email_sync_dispatch_job";

export const buildEmailSyncDispatchJob = ({
  jobId = "",
  tenantId = "",
  connectionId = "",
} = {}) => ({
  jobId: String(jobId || ""),
  tenantId: String(tenantId || ""),
  connectionId: String(connectionId || ""),
});

export const buildEmailSyncDispatchDedupeKey = (job = {}) =>
  `${EMAIL_SYNC_DISPATCH_DEDUPE_PREFIX}:${String(job.jobId || "")}`;

export const enqueueEmailSyncDispatchJob = async ({
  redisClient,
  queueKey = EMAIL_SYNC_DISPATCH_QUEUE_KEY,
  job,
} = {}) => {
  await redisClient.lPush(queueKey, JSON.stringify(job));
};

export const dequeueEmailSyncDispatchJob = async ({
  redisClient,
  queueKey = EMAIL_SYNC_DISPATCH_QUEUE_KEY,
} = {}) => {
  const payload = await redisClient.rPop(queueKey);
  return payload ? JSON.parse(payload) : null;
};

export const markEmailSyncDispatchQueued = async ({
  redisClient,
  job,
  ttlSeconds = 60 * 60,
} = {}) => {
  const result = await redisClient.set(
    buildEmailSyncDispatchDedupeKey(job),
    "1",
    { NX: true, EX: ttlSeconds }
  );

  return result === "OK";
};

export const acquireEmailSyncDispatchLock = async ({
  redisClient,
  lockKey = EMAIL_SYNC_DISPATCH_LOCK_KEY,
  ttlSeconds = 60,
} = {}) => {
  const result = await redisClient.set(lockKey, "1", { NX: true, EX: ttlSeconds });
  return result === "OK";
};

export const releaseEmailSyncDispatchLock = async ({
  redisClient,
  lockKey = EMAIL_SYNC_DISPATCH_LOCK_KEY,
} = {}) => {
  await redisClient.del(lockKey);
};

export const processQueuedEmailSyncJob = async ({
  job,
  loadSyncJob = async () => null,
  loadConnection = async () => null,
} = {}) => {
  const syncJob = await loadSyncJob(job);
  if (!syncJob) {
    return { changed: false, failed: true, missing: true };
  }

  syncJob.status = "running";
  syncJob.startedAt = new Date();
  await syncJob.save();

  const connection = await loadConnection(job, syncJob);
  if (!connection) {
    syncJob.status = "failed";
    syncJob.completedAt = new Date();
    syncJob.errorMessage = "Connection not found for queued email sync.";
    syncJob.resultSummary = "Email sync could not start because the connection record is missing.";
    syncJob.metadata = {
      ...(syncJob.metadata || {}),
      simulated: true,
      queued: true,
    };
    await syncJob.save();
    return { changed: true, failed: true, missing: false };
  }

  const snapshot = buildSyncJobSnapshot(connection);
  Object.assign(syncJob, snapshot, {
    metadata: {
      ...(syncJob.metadata || {}),
      ...(snapshot.metadata || {}),
      queued: true,
    },
  });
  await syncJob.save();

  return { changed: true, failed: syncJob.status === "failed", missing: false };
};

export const drainEmailSyncDispatchQueue = async ({
  limit = 25,
  dequeueJob = async () => null,
  loadSyncJob = async () => null,
  loadConnection = async () => null,
} = {}) => {
  const summary = {
    attempted: 0,
    processed: 0,
    failed: 0,
    remaining: false,
  };

  for (let index = 0; index < limit; index += 1) {
    const job = await dequeueJob();
    if (!job) {
      summary.remaining = false;
      return summary;
    }

    summary.attempted += 1;

    const result = await processQueuedEmailSyncJob({
      job,
      loadSyncJob,
      loadConnection,
    });

    if (result.changed && !result.failed) {
      summary.processed += 1;
      continue;
    }

    if (result.failed || result.missing) {
      summary.failed += 1;
    }
  }

  summary.remaining = true;
  return summary;
};
