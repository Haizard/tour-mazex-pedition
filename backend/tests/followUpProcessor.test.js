import test from "node:test";
import assert from "node:assert/strict";

import { processDueTouchpoints } from "../utils/followUpProcessor.js";

test("processDueTouchpoints marks due whatsapp touchpoints as sent when delivery succeeds", async () => {
  const now = new Date("2026-04-29T12:00:00.000Z");
  const sequence = {
    inquiryId: { phone: "+255700000000" },
    touchpoints: [
      {
        scheduledAt: new Date("2026-04-29T11:00:00.000Z"),
        channel: "whatsapp",
        content: "Checking back in",
        status: "pending",
        sentAt: null,
      },
    ],
  };

  const sentMessages = [];
  const result = await processDueTouchpoints({
    sequence,
    now,
    sendWhatsAppMessage: async ({ phone, message }) => {
      sentMessages.push({ phone, message });
    },
  });

  assert.equal(result.changed, true);
  assert.equal(sequence.touchpoints[0].status, "sent");
  assert.ok(sequence.touchpoints[0].sentAt instanceof Date);
  assert.deepEqual(sentMessages, [{ phone: "+255700000000", message: "Checking back in" }]);
});

test("processDueTouchpoints marks due touchpoints failed when delivery throws", async () => {
  const now = new Date("2026-04-29T12:00:00.000Z");
  const sequence = {
    inquiryId: { phone: "+255700000000" },
    touchpoints: [
      {
        scheduledAt: new Date("2026-04-29T11:00:00.000Z"),
        channel: "whatsapp",
        content: "Checking back in",
        status: "pending",
        sentAt: null,
      },
    ],
  };

  const result = await processDueTouchpoints({
    sequence,
    now,
    sendWhatsAppMessage: async () => {
      throw new Error("delivery failed");
    },
  });

  assert.equal(result.changed, true);
  assert.equal(sequence.touchpoints[0].status, "failed");
  assert.equal(sequence.touchpoints[0].sentAt, null);
});

test("processDueTouchpoints ignores future or non-pending touchpoints", async () => {
  const now = new Date("2026-04-29T12:00:00.000Z");
  const sequence = {
    inquiryId: { phone: "+255700000000" },
    touchpoints: [
      {
        scheduledAt: new Date("2026-04-30T11:00:00.000Z"),
        channel: "whatsapp",
        content: "Future follow-up",
        status: "pending",
        sentAt: null,
      },
      {
        scheduledAt: new Date("2026-04-29T10:00:00.000Z"),
        channel: "whatsapp",
        content: "Already sent",
        status: "sent",
        sentAt: new Date("2026-04-29T10:05:00.000Z"),
      },
    ],
  };

  let sentCount = 0;
  const result = await processDueTouchpoints({
    sequence,
    now,
    sendWhatsAppMessage: async () => {
      sentCount += 1;
    },
  });

  assert.equal(result.changed, false);
  assert.equal(sentCount, 0);
  assert.equal(sequence.touchpoints[0].status, "pending");
  assert.equal(sequence.touchpoints[1].status, "sent");
});
