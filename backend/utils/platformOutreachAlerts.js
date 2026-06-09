const alertEventTypes = new Set([
  "outreach_alert_unmatched_reply",
  "outreach_alert_dispatch_failure",
]);

export const buildPlatformOutreachAlertEvent = ({
  type = "unmatched_reply",
  channel = "email",
  participantAddress = "",
  providerMessageId = "",
  failureCount = 1,
  providerError = "",
  metadata = {},
} = {}) => {
  if (type === "dispatch_failure") {
    return {
      eventType: "outreach_alert_dispatch_failure",
      actorType: "provider",
      summary: `${failureCount} failed ${channel} dispatches need platform admin attention.`,
      metadata: {
        priority: Number(failureCount || 0) >= 3 ? "high" : "medium",
        channel,
        failureCount,
        providerError,
        ...metadata,
      },
    };
  }

  return {
    eventType: "outreach_alert_unmatched_reply",
    actorType: "provider",
    summary: `Unmatched ${channel} reply needs platform admin review.`,
    metadata: {
      priority: "high",
      channel,
      participantAddress,
      providerMessageId,
      ...metadata,
    },
  };
};

export const summarizePlatformOutreachAlerts = (events = []) =>
  events.reduce(
    (summary, event) => {
      if (!alertEventTypes.has(event.eventType)) return summary;
      summary.totalAlertCount += 1;
      if (event.metadata?.priority === "high") summary.highPriorityAlertCount += 1;
      if (event.eventType === "outreach_alert_unmatched_reply") summary.unmatchedReplyAlertCount += 1;
      if (event.eventType === "outreach_alert_dispatch_failure") summary.dispatchFailureAlertCount += 1;
      return summary;
    },
    {
      totalAlertCount: 0,
      highPriorityAlertCount: 0,
      unmatchedReplyAlertCount: 0,
      dispatchFailureAlertCount: 0,
    },
  );

export const platformOutreachAlertEventTypes = [...alertEventTypes];
