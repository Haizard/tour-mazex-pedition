import PlatformOutreachMessage from "../models/PlatformOutreachMessage.js";
import PlatformSocialPost from "../models/PlatformSocialPost.js";
import { getRedisClient as defaultGetRedisClient } from "./redisClient.js";
import {
  acquirePlatformOutreachDispatchLock,
  dequeuePlatformOutreachDispatchJob,
  drainPlatformOutreachDispatchQueue,
  enqueuePlatformOutreachDispatchJob,
  markPlatformOutreachDispatchQueued,
  queueDuePlatformOutreachDispatches,
  releasePlatformOutreachDispatchLock,
} from "./platformOutreachProcessor.js";

const emptySummary = () => ({
  queued: 0,
  attempted: 0,
  processed: 0,
  failed: 0,
  remaining: false,
});

export const processQueuedPlatformOutreachNow = async ({
  env = globalThis.process?.env || {},
  limit = 25,
  getRedisClient = defaultGetRedisClient,
  queueDueDispatches = queueDuePlatformOutreachDispatches,
  drainQueue = drainPlatformOutreachDispatchQueue,
} = {}) => {
  const redisClient = await getRedisClient(env).catch(() => null);

  if (!redisClient) {
    return emptySummary();
  }

  const lockAcquired = await acquirePlatformOutreachDispatchLock({ redisClient });
  if (!lockAcquired) {
    return {
      ...emptySummary(),
      remaining: true,
    };
  }

  try {
    const queued = await queueDueDispatches({
      loadDueMessages: async (now) =>
        PlatformOutreachMessage.find({
          status: "queued",
          $or: [{ scheduledFor: null }, { scheduledFor: { $lte: now } }],
        })
          .limit(limit)
          .lean(),
      loadDueSocialPosts: async (now) =>
        PlatformSocialPost.find({
          status: "scheduled",
          $or: [{ scheduledFor: null }, { scheduledFor: { $lte: now } }],
        })
          .limit(limit)
          .lean(),
      markQueued: async (job) => markPlatformOutreachDispatchQueued({ redisClient, job }),
      enqueueJob: async (job) => enqueuePlatformOutreachDispatchJob({ redisClient, job }),
    });

    const drained = await drainQueue({
      limit,
      dequeueJob: async () => dequeuePlatformOutreachDispatchJob({ redisClient }),
    });

    return {
      queued: queued.enqueuedCount || 0,
      attempted: drained.attempted || 0,
      processed: drained.processed || 0,
      failed: drained.failed || 0,
      remaining: Boolean(drained.remaining),
    };
  } finally {
    await releasePlatformOutreachDispatchLock({ redisClient }).catch(() => {});
  }
};

let platformOutreachLoopHandle = null;

export const startPlatformOutreachProcessingLoop = ({
  env = globalThis.process?.env || {},
  intervalMs = 30000,
} = {}) => {
  if (platformOutreachLoopHandle) {
    return platformOutreachLoopHandle;
  }

  platformOutreachLoopHandle = setInterval(() => {
    processQueuedPlatformOutreachNow({ env }).catch((error) => {
      console.error("Platform outreach processing loop error:", error.message);
    });
  }, intervalMs);

  return platformOutreachLoopHandle;
};

export const stopPlatformOutreachProcessingLoop = () => {
  if (!platformOutreachLoopHandle) {
    return;
  }

  clearInterval(platformOutreachLoopHandle);
  platformOutreachLoopHandle = null;
};
