export const SOCIAL_POST_DISPATCH_QUEUE_KEY = "social_post_dispatch_jobs";
export const SOCIAL_POST_DISPATCH_LOCK_KEY = "social_post_dispatch_lock";
export const SOCIAL_POST_DISPATCH_DEDUPE_PREFIX = "social_post_dispatch_job";

export const buildSocialPostDispatchJob = ({
  postId = "",
  tenantId = "",
} = {}) => ({
  postId: String(postId || ""),
  tenantId: String(tenantId || ""),
});

export const buildSocialPostDispatchDedupeKey = (job = {}) =>
  `${SOCIAL_POST_DISPATCH_DEDUPE_PREFIX}:${String(job.postId || "")}`;

export const enqueueSocialPostDispatchJob = async ({
  redisClient,
  queueKey = SOCIAL_POST_DISPATCH_QUEUE_KEY,
  job,
} = {}) => {
  await redisClient.lPush(queueKey, JSON.stringify(job));
};

export const dequeueSocialPostDispatchJob = async ({
  redisClient,
  queueKey = SOCIAL_POST_DISPATCH_QUEUE_KEY,
} = {}) => {
  const payload = await redisClient.rPop(queueKey);
  return payload ? JSON.parse(payload) : null;
};

export const markSocialPostDispatchQueued = async ({
  redisClient,
  job,
  ttlSeconds = 60 * 60 * 24,
} = {}) => {
  const result = await redisClient.set(
    buildSocialPostDispatchDedupeKey(job),
    "1",
    { NX: true, EX: ttlSeconds }
  );

  return result === "OK";
};

export const acquireSocialPostDispatchLock = async ({
  redisClient,
  lockKey = SOCIAL_POST_DISPATCH_LOCK_KEY,
  ttlSeconds = 60,
} = {}) => {
  const result = await redisClient.set(lockKey, "1", { NX: true, EX: ttlSeconds });
  return result === "OK";
};

export const releaseSocialPostDispatchLock = async ({
  redisClient,
  lockKey = SOCIAL_POST_DISPATCH_LOCK_KEY,
} = {}) => {
  await redisClient.del(lockKey);
};

export const processQueuedSocialPost = async ({
  job,
  loadPost = async () => null,
  loadMetaAccount = async () => null,
  publishPost = async () => ({}),
} = {}) => {
  const socialPost = await loadPost(job);
  if (!socialPost) {
    return { changed: false, failed: true, missing: true };
  }

  const metaAccount = await loadMetaAccount(job, socialPost);
  if (!metaAccount) {
    socialPost.status = "failed";
    socialPost.lastError = "Connect an active Meta account before running the social automation queue.";
    await socialPost.save();
    return { changed: true, failed: true, missing: false };
  }

  try {
    const publishResult = await publishPost(socialPost, metaAccount, job);
    socialPost.status = "published";
    socialPost.publishResult = publishResult;
    socialPost.lastError = "";
    await socialPost.save();
    return { changed: true, failed: false, missing: false };
  } catch (error) {
    socialPost.status = "failed";
    socialPost.lastError = error.message;
    await socialPost.save();
    return { changed: true, failed: true, missing: false };
  }
};

export const drainSocialPostDispatchQueue = async ({
  limit = 25,
  dequeueJob = async () => null,
  loadPost = async () => null,
  loadMetaAccount = async () => null,
  publishPost = async () => ({}),
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
    const result = await processQueuedSocialPost({
      job,
      loadPost,
      loadMetaAccount,
      publishPost,
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
