import SocialAccount from "../models/SocialAccount.js";
import SocialPost from "../models/SocialPost.js";
import { getRedisClient } from "./redisClient.js";
import { publishSocialPostToPlatforms } from "./socialAutomation.js";
import {
  acquireSocialPostDispatchLock,
  dequeueSocialPostDispatchJob,
  drainSocialPostDispatchQueue,
  releaseSocialPostDispatchLock,
} from "./socialPostQueue.js";

export const processQueuedSocialPostsNow = async ({
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

  const lockAcquired = await acquireSocialPostDispatchLock({ redisClient });
  if (!lockAcquired) {
    return {
      attempted: 0,
      processed: 0,
      failed: 0,
      remaining: true,
    };
  }

  try {
    return await drainSocialPostDispatchQueue({
      limit,
      dequeueJob: async () => dequeueSocialPostDispatchJob({ redisClient }),
      loadPost: async (job) =>
        SocialPost.findOne({
          _id: job.postId,
          tenantId: job.tenantId,
        }),
      loadMetaAccount: async (job) =>
        SocialAccount.findOne({
          tenantId: job.tenantId,
          provider: "meta",
          status: "active",
        }),
      publishPost: async (socialPost, metaAccount) =>
        publishSocialPostToPlatforms(socialPost, metaAccount),
    });
  } finally {
    await releaseSocialPostDispatchLock({ redisClient }).catch(() => {});
  }
};

let socialPostLoopHandle = null;

export const startSocialPostProcessingLoop = ({
  env = globalThis.process?.env || {},
  intervalMs = 30000,
} = {}) => {
  if (socialPostLoopHandle) {
    return socialPostLoopHandle;
  }

  socialPostLoopHandle = setInterval(() => {
    processQueuedSocialPostsNow({ env }).catch((error) => {
      console.error("Social post processing loop error:", error.message);
    });
  }, intervalMs);

  return socialPostLoopHandle;
};

export const stopSocialPostProcessingLoop = () => {
  if (!socialPostLoopHandle) {
    return;
  }

  clearInterval(socialPostLoopHandle);
  socialPostLoopHandle = null;
};
