import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlatformOutreachEventPayload,
  recordPlatformOutreachEvent,
} from "../utils/platformOutreachEventLog.js";

test("buildPlatformOutreachEventPayload creates a platform-admin audit envelope", () => {
  const payload = buildPlatformOutreachEventPayload({
    eventType: "campaign_created",
    req: {
      platformAdmin: { _id: "admin-123" },
    },
    campaignId: "campaign-123",
    summary: "Campaign created.",
    metadata: { channels: ["email"] },
  });

  assert.deepEqual(payload, {
    eventType: "campaign_created",
    prospectId: null,
    campaignId: "campaign-123",
    messageId: null,
    actorType: "platform-admin",
    actorId: "admin-123",
    summary: "Campaign created.",
    metadata: { channels: ["email"] },
  });
});

test("recordPlatformOutreachEvent writes through the provided model", async () => {
  const writes = [];
  const result = await recordPlatformOutreachEvent({
    EventLogModel: {
      create: async (payload) => {
        writes.push(payload);
        return { _id: "event-1", ...payload };
      },
    },
    event: {
      eventType: "prospect_saved",
      req: { platformAdmin: { _id: "admin-123" } },
      prospectId: "prospect-1",
      summary: "Prospect saved.",
    },
  });

  assert.equal(result._id, "event-1");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].eventType, "prospect_saved");
  assert.equal(writes[0].actorType, "platform-admin");
});

test("recordPlatformOutreachEvent does not break the route when audit storage fails", async () => {
  const result = await recordPlatformOutreachEvent({
    EventLogModel: {
      create: async () => {
        throw new Error("database unavailable");
      },
    },
    logger: { warn: () => {} },
    event: {
      eventType: "campaign_launch_blocked",
      actorType: "system",
      summary: "Readiness failed.",
    },
  });

  assert.equal(result, null);
});
