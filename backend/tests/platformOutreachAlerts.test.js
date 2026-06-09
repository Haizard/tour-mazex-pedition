import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlatformOutreachAlertEvent,
  summarizePlatformOutreachAlerts,
} from "../utils/platformOutreachAlerts.js";

test("buildPlatformOutreachAlertEvent creates a high-priority unmatched reply alert", () => {
  const alert = buildPlatformOutreachAlertEvent({
    type: "unmatched_reply",
    channel: "email",
    participantAddress: "sales@example.com",
    providerMessageId: "provider-1",
  });

  assert.equal(alert.eventType, "outreach_alert_unmatched_reply");
  assert.equal(alert.actorType, "provider");
  assert.equal(alert.metadata.priority, "high");
  assert.match(alert.summary, /unmatched email reply/i);
});

test("buildPlatformOutreachAlertEvent creates a repeated dispatch failure alert", () => {
  const alert = buildPlatformOutreachAlertEvent({
    type: "dispatch_failure",
    channel: "whatsapp",
    failureCount: 3,
    providerError: "Meta rejected template",
  });

  assert.equal(alert.eventType, "outreach_alert_dispatch_failure");
  assert.equal(alert.metadata.failureCount, 3);
  assert.match(alert.summary, /3 failed whatsapp dispatches/i);
});

test("summarizePlatformOutreachAlerts counts open alert types", () => {
  const summary = summarizePlatformOutreachAlerts([
    { eventType: "outreach_alert_unmatched_reply", metadata: { priority: "high" } },
    { eventType: "outreach_alert_dispatch_failure", metadata: { priority: "high" } },
    { eventType: "outreach_alert_dispatch_failure", metadata: { priority: "medium" } },
  ]);

  assert.deepEqual(summary, {
    totalAlertCount: 3,
    highPriorityAlertCount: 2,
    unmatchedReplyAlertCount: 1,
    dispatchFailureAlertCount: 2,
  });
});
