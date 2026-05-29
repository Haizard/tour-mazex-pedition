import PlatformOutreachEventLog from "../models/PlatformOutreachEventLog.js";

const toActorId = (actor = {}) => {
  const id = actor?._id || actor?.id || "";
  return id ? String(id) : "";
};

export const buildPlatformOutreachEventPayload = ({
  eventType,
  req = {},
  prospectId = null,
  campaignId = null,
  messageId = null,
  actorType,
  actorId,
  summary = "",
  metadata = {},
} = {}) => {
  const platformAdminId = toActorId(req.platformAdmin);
  return {
    eventType,
    prospectId,
    campaignId,
    messageId,
    actorType: actorType || (platformAdminId ? "platform-admin" : "system"),
    actorId: actorId || platformAdminId,
    summary,
    metadata,
  };
};

export const recordPlatformOutreachEvent = async ({
  EventLogModel = PlatformOutreachEventLog,
  event = {},
  logger = console,
} = {}) => {
  try {
    return await EventLogModel.create(buildPlatformOutreachEventPayload(event));
  } catch (error) {
    logger.warn?.("[Platform Outreach] Failed to write event log", {
      eventType: event.eventType,
      error: error.message,
    });
    return null;
  }
};
