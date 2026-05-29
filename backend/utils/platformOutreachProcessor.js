import PlatformOutreachMessage from "../models/PlatformOutreachMessage.js";
import PlatformOutreachProspect from "../models/PlatformOutreachProspect.js";
import PlatformOutreachSettings from "../models/PlatformOutreachSettings.js";
import PlatformSocialPost from "../models/PlatformSocialPost.js";
import { assertCanSendPlatformMessage } from "./platformOutreachCompliance.js";
import { recordPlatformOutreachEvent } from "./platformOutreachEventLog.js";
import { resolvePlatformOutreachReadiness } from "./platformOutreachProviders.js";

export const PLATFORM_OUTREACH_DISPATCH_QUEUE_KEY = "platform_outreach_dispatch_jobs";
export const PLATFORM_OUTREACH_DISPATCH_LOCK_KEY = "platform_outreach_dispatch_lock";
export const PLATFORM_OUTREACH_DISPATCH_DEDUPE_PREFIX = "platform_outreach_dispatch_job";

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isDue = (value, now = new Date()) => {
  const date = toDate(value);
  return !date || date <= now;
};

export const buildPlatformOutreachDispatchJob = ({
  messageId = "",
  socialPostId = "",
} = {}) => ({
  type: socialPostId ? "social-post" : "message",
  messageId: String(messageId || ""),
  socialPostId: String(socialPostId || ""),
});

export const buildPlatformOutreachDispatchDedupeKey = (job = {}) =>
  `${PLATFORM_OUTREACH_DISPATCH_DEDUPE_PREFIX}:${job.type || "message"}:${job.messageId || job.socialPostId || ""}`;

export const enqueuePlatformOutreachDispatchJob = async ({
  redisClient,
  queueKey = PLATFORM_OUTREACH_DISPATCH_QUEUE_KEY,
  job,
} = {}) => {
  await redisClient.lPush(queueKey, JSON.stringify(job));
};

export const dequeuePlatformOutreachDispatchJob = async ({
  redisClient,
  queueKey = PLATFORM_OUTREACH_DISPATCH_QUEUE_KEY,
} = {}) => {
  const payload = await redisClient.rPop(queueKey);
  return payload ? JSON.parse(payload) : null;
};

export const markPlatformOutreachDispatchQueued = async ({
  redisClient,
  job,
  ttlSeconds = 60 * 60 * 24,
} = {}) => {
  const result = await redisClient.set(
    buildPlatformOutreachDispatchDedupeKey(job),
    "1",
    { NX: true, EX: ttlSeconds }
  );

  return result === "OK";
};

export const acquirePlatformOutreachDispatchLock = async ({
  redisClient,
  lockKey = PLATFORM_OUTREACH_DISPATCH_LOCK_KEY,
  ttlSeconds = 60,
} = {}) => {
  const result = await redisClient.set(lockKey, "1", { NX: true, EX: ttlSeconds });
  return result === "OK";
};

export const releasePlatformOutreachDispatchLock = async ({
  redisClient,
  lockKey = PLATFORM_OUTREACH_DISPATCH_LOCK_KEY,
} = {}) => {
  await redisClient.del(lockKey);
};

export const queueDuePlatformOutreachDispatches = async ({
  now = new Date(),
  loadDueMessages = async () => [],
  loadDueSocialPosts = async () => [],
  markQueued = async () => true,
  enqueueJob = async () => {},
} = {}) => {
  const dueMessages = await loadDueMessages(now);
  const dueSocialPosts = await loadDueSocialPosts(now);
  let enqueuedCount = 0;

  for (const message of dueMessages || []) {
    if (!["queued"].includes(message.status) || !isDue(message.scheduledFor, now)) continue;
    const job = buildPlatformOutreachDispatchJob({ messageId: message._id });
    if (!(await markQueued(job))) continue;
    await enqueueJob(job);
    enqueuedCount += 1;
  }

  for (const post of dueSocialPosts || []) {
    if (post.status !== "scheduled" || !isDue(post.scheduledFor, now)) continue;
    const job = buildPlatformOutreachDispatchJob({ socialPostId: post._id });
    if (!(await markQueued(job))) continue;
    await enqueueJob(job);
    enqueuedCount += 1;
  }

  return { enqueuedCount };
};

const failMessage = async ({ message, error, recordEvent = async () => {} }) => {
  message.status = "failed";
  message.providerError = error;
  await message.save();
  await recordEvent({
    eventType: "message_send_failed",
    actorType: "provider",
    prospectId: message.prospectId,
    campaignId: message.campaignId,
    messageId: message._id,
    summary: "Platform outreach message failed during queued dispatch.",
    metadata: { error, channel: message.channel },
  });
  return { changed: true, failed: true, missing: false };
};

const processQueuedMessage = async ({
  job,
  now = new Date(),
  loadMessage,
  loadProspect,
  loadSettings,
  resolveReadiness,
  sendMessage,
  recordEvent,
} = {}) => {
  const message = await loadMessage(job);
  if (!message) return { changed: false, failed: true, missing: true };
  if (!["queued"].includes(message.status) || !isDue(message.scheduledFor, now)) {
    return { changed: false, failed: false, missing: false };
  }

  const prospect = await loadProspect(message);
  if (!prospect) {
    return failMessage({ message, error: "Prospect not found for queued outreach message.", recordEvent });
  }

  const settings = await loadSettings();
  const readiness = resolveReadiness({
    settings,
    channels: [message.channel],
    env: process.env,
  });

  if (!readiness.ready) {
    return failMessage({
      message,
      error: `Provider readiness failed: ${(readiness.missing || []).join(", ")}`,
      recordEvent,
    });
  }

  try {
    assertCanSendPlatformMessage({ channel: message.channel, prospect });
    const providerResult = await sendMessage({ message, prospect, settings });
    message.status = "sent";
    message.providerMessageId = providerResult?.providerMessageId || providerResult?.id || "";
    message.providerError = "";
    message.sentAt = new Date(now);
    await message.save();
    await recordEvent({
      eventType: "message_sent",
      actorType: "provider",
      prospectId: message.prospectId,
      campaignId: message.campaignId,
      messageId: message._id,
      summary: "Platform outreach message sent by queued dispatcher.",
      metadata: { channel: message.channel, providerResult },
    });
    return { changed: true, failed: false, missing: false };
  } catch (error) {
    return failMessage({ message, error: error.message, recordEvent });
  }
};

const processQueuedSocialPost = async ({
  job,
  loadSocialPost,
  publishSocialPost,
  recordEvent,
} = {}) => {
  const post = await loadSocialPost(job);
  if (!post) return { changed: false, failed: true, missing: true };
  if (post.status !== "scheduled") return { changed: false, failed: false, missing: false };

  try {
    const publishResult = await publishSocialPost(post);
    post.status = "published";
    post.publishResult = publishResult;
    post.lastError = "";
    await post.save();
    await recordEvent({
      eventType: "social_post_published",
      actorType: "provider",
      summary: `Platform social post published: ${post.title}.`,
      metadata: {
        socialPostId: String(post._id),
        platforms: post.platforms,
        publishResult,
      },
    });
    return { changed: true, failed: false, missing: false };
  } catch (error) {
    post.status = "failed";
    post.lastError = error.message;
    await post.save();
    await recordEvent({
      eventType: "social_post_publish_failed",
      actorType: "provider",
      summary: `Platform social post failed: ${post.title}.`,
      metadata: {
        socialPostId: String(post._id),
        platforms: post.platforms,
        error: error.message,
      },
    });
    return { changed: true, failed: true, missing: false };
  }
};

export const processQueuedPlatformOutreachJob = async ({
  job,
  now = new Date(),
  loadMessage = async (currentJob) => PlatformOutreachMessage.findById(currentJob.messageId),
  loadProspect = async (message) => PlatformOutreachProspect.findById(message.prospectId),
  loadSettings = async () => PlatformOutreachSettings.findOne({ singletonKey: "platform-outreach" }).lean(),
  loadSocialPost = async (currentJob) => PlatformSocialPost.findById(currentJob.socialPostId),
  resolveReadiness = resolvePlatformOutreachReadiness,
  sendMessage = async () => {
    throw new Error("No platform outreach message provider adapter is configured.");
  },
  publishSocialPost = async () => {
    throw new Error("No platform social publishing adapter is configured.");
  },
  recordEvent = async (event) => recordPlatformOutreachEvent({ event }),
} = {}) => {
  if (job?.type === "social-post") {
    return processQueuedSocialPost({
      job,
      loadSocialPost,
      publishSocialPost,
      recordEvent,
    });
  }

  return processQueuedMessage({
    job,
    now,
    loadMessage,
    loadProspect,
    loadSettings,
    resolveReadiness,
    sendMessage,
    recordEvent,
  });
};

export const drainPlatformOutreachDispatchQueue = async ({
  limit = 25,
  dequeueJob = async () => null,
  ...processorOptions
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
    const result = await processQueuedPlatformOutreachJob({ job, ...processorOptions });

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
