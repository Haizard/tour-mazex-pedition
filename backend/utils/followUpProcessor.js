export const FOLLOW_UP_DISPATCH_QUEUE_KEY = "follow_up_dispatch_jobs";
export const FOLLOW_UP_DISPATCH_LOCK_KEY = "follow_up_dispatch_lock";
export const FOLLOW_UP_DISPATCH_DEDUPE_PREFIX = "follow_up_dispatch_job";

const toDate = (value) => {
  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const buildFollowUpDispatchJob = ({
  sequence,
  touchpointIndex = -1,
} = {}) => ({
  sequenceId: String(sequence?._id || ""),
  tenantId: String(sequence?.tenantId || ""),
  inquiryId: String(sequence?.inquiryId?._id || sequence?.inquiryId || ""),
  touchpointIndex: Number(touchpointIndex),
});

export const buildFollowUpDispatchDedupeKey = (job = {}) =>
  `${FOLLOW_UP_DISPATCH_DEDUPE_PREFIX}:${String(job.sequenceId || "")}:${Number(job.touchpointIndex)}`;

export const enqueueFollowUpDispatchJob = async ({
  redisClient,
  queueKey = FOLLOW_UP_DISPATCH_QUEUE_KEY,
  job,
} = {}) => {
  await redisClient.lPush(queueKey, JSON.stringify(job));
};

export const dequeueFollowUpDispatchJob = async ({
  redisClient,
  queueKey = FOLLOW_UP_DISPATCH_QUEUE_KEY,
} = {}) => {
  const payload = await redisClient.rPop(queueKey);
  return payload ? JSON.parse(payload) : null;
};

export const markFollowUpDispatchQueued = async ({
  redisClient,
  job,
  ttlSeconds = 60 * 60 * 24 * 7,
} = {}) => {
  const result = await redisClient.set(
    buildFollowUpDispatchDedupeKey(job),
    "1",
    { NX: true, EX: ttlSeconds }
  );

  return result === "OK";
};

export const acquireFollowUpProcessingLock = async ({
  redisClient,
  lockKey = FOLLOW_UP_DISPATCH_LOCK_KEY,
  ttlSeconds = 60,
} = {}) => {
  const result = await redisClient.set(lockKey, "1", { NX: true, EX: ttlSeconds });
  return result === "OK";
};

export const releaseFollowUpProcessingLock = async ({
  redisClient,
  lockKey = FOLLOW_UP_DISPATCH_LOCK_KEY,
} = {}) => {
  await redisClient.del(lockKey);
};

export const processDueTouchpoints = async ({
  sequence,
  now = new Date(),
  sendWhatsAppMessage = async () => {},
} = {}) => {
  if (!sequence || !Array.isArray(sequence.touchpoints)) {
    return { changed: false };
  }

  let changed = false;

  for (const touchpoint of sequence.touchpoints) {
    if (touchpoint.status !== "pending") {
      continue;
    }

    const scheduledAt = toDate(touchpoint.scheduledAt);

    if (!scheduledAt || scheduledAt > now) {
      continue;
    }

    try {
      if (touchpoint.channel === "whatsapp" && sequence.inquiryId?.phone) {
        await sendWhatsAppMessage({
          phone: sequence.inquiryId.phone,
          message: touchpoint.content,
        });
      }

      touchpoint.status = "sent";
      touchpoint.sentAt = new Date(now);
      changed = true;
    } catch (_error) {
      touchpoint.status = "failed";
      touchpoint.sentAt = null;
      changed = true;
    }
  }

  return { changed };
};

export const queueDueTouchpoints = async ({
  sequence,
  now = new Date(),
  enqueueJob = async () => {},
  markDispatched = async () => true,
} = {}) => {
  if (!sequence || !Array.isArray(sequence.touchpoints)) {
    return { enqueuedCount: 0 };
  }

  let enqueuedCount = 0;

  for (const [touchpointIndex, touchpoint] of sequence.touchpoints.entries()) {
    if (touchpoint.status !== "pending") {
      continue;
    }

    const scheduledAt = toDate(touchpoint.scheduledAt);
    if (!scheduledAt || scheduledAt > now) {
      continue;
    }

    const job = buildFollowUpDispatchJob({ sequence, touchpointIndex });
    const shouldEnqueue = await markDispatched(job);

    if (!shouldEnqueue) {
      continue;
    }

    await enqueueJob(job);
    enqueuedCount += 1;
  }

  return { enqueuedCount };
};

export const processQueuedTouchpoint = async ({
  sequence,
  job,
  now = new Date(),
  loadChannelContext = async () => sequence?.inquiryId || {},
  sendWhatsAppMessage = async () => {},
} = {}) => {
  const touchpoint = sequence?.touchpoints?.[job.touchpointIndex];
  if (!touchpoint || touchpoint.status !== "pending") {
    return { changed: false, skipped: true };
  }

  const scheduledAt = toDate(touchpoint.scheduledAt);
  if (!scheduledAt || scheduledAt > now) {
    return { changed: false, skipped: true };
  }

  const channelContext = await loadChannelContext(sequence, job);

  try {
    if (touchpoint.channel === "whatsapp") {
      if (!channelContext?.phone) {
        throw new Error("Missing channel context for WhatsApp follow-up dispatch.");
      }

      await sendWhatsAppMessage({
        phone: channelContext.phone,
        message: touchpoint.content,
      }, channelContext);
    }

    touchpoint.status = "sent";
    touchpoint.sentAt = new Date(now);
    return { changed: true, skipped: false };
  } catch (_error) {
    touchpoint.status = "failed";
    touchpoint.sentAt = null;
    return { changed: true, skipped: false };
  }
};

export const drainFollowUpDispatchQueue = async ({
  now = new Date(),
  limit = 25,
  dequeueJob = async () => null,
  loadSequence = async () => null,
  loadChannelContext = async () => ({}),
  sendWhatsAppMessage = async () => {},
  saveSequence = async () => {},
  syncSequence = async () => {},
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

    const sequence = await loadSequence(job);
    if (!sequence) {
      summary.failed += 1;
      continue;
    }

    const result = await processQueuedTouchpoint({
      sequence,
      job,
      now,
      loadChannelContext,
      sendWhatsAppMessage,
    });

    if (!result.changed) {
      continue;
    }

    await saveSequence(sequence);
    await syncSequence(sequence);
    summary.processed += 1;
  }

  summary.remaining = true;
  return summary;
};
