import EmailProviderConnection from "../models/EmailProviderConnection.js";
import EmailSyncJob from "../models/EmailSyncJob.js";
import { getRedisClient } from "./redisClient.js";
import {
  acquireEmailSyncDispatchLock,
  dequeueEmailSyncDispatchJob,
  drainEmailSyncDispatchQueue,
  releaseEmailSyncDispatchLock,
} from "./emailSyncQueue.js";

export const processQueuedEmailSyncJobsNow = async ({
  env = globalThis.process?.env || {},
  limit = 25,
} = {}) => {
  const redisClient = await getRedisClient(env).catch(() => null);

  if (!redisClient) {
    return {
      attempted: 0,
      processed: 0,
      failed: 0,
      remaining: false,
    };
  }

  const lockAcquired = await acquireEmailSyncDispatchLock({ redisClient });
  if (!lockAcquired) {
    return {
      attempted: 0,
      processed: 0,
      failed: 0,
      remaining: true,
    };
  }

  try {
    return await drainEmailSyncDispatchQueue({
      limit,
      dequeueJob: async () => dequeueEmailSyncDispatchJob({ redisClient }),
      loadSyncJob: async (job) =>
        EmailSyncJob.findOne({
          _id: job.jobId,
          tenantId: job.tenantId,
          connectionId: job.connectionId,
        }),
      loadConnection: async (job) =>
        EmailProviderConnection.findOne({
          _id: job.connectionId,
          tenantId: job.tenantId,
        }).lean(),
    });
  } finally {
    await releaseEmailSyncDispatchLock({ redisClient }).catch(() => {});
  }
};

let emailSyncLoopHandle = null;

export const startEmailSyncProcessingLoop = ({
  env = globalThis.process?.env || {},
  intervalMs = 30000,
} = {}) => {
  if (emailSyncLoopHandle) {
    return emailSyncLoopHandle;
  }

  emailSyncLoopHandle = setInterval(() => {
    processQueuedEmailSyncJobsNow({ env }).catch((error) => {
      console.error("Email sync processing loop error:", error.message);
    });
  }, intervalMs);

  return emailSyncLoopHandle;
};

export const stopEmailSyncProcessingLoop = () => {
  if (!emailSyncLoopHandle) {
    return;
  }

  clearInterval(emailSyncLoopHandle);
  emailSyncLoopHandle = null;
};
