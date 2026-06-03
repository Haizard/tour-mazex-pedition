import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizePlatformEmailWebhookPayload,
  normalizePlatformWhatsAppWebhookPayload,
} from "../utils/platformOutreachWebhooks.js";

test("normalizePlatformEmailWebhookPayload extracts an inbound reply", () => {
  const replies = normalizePlatformEmailWebhookPayload({
    type: "email.replied",
    data: {
      from: " Sales@Operator.com ",
      subject: "Re: Mazex demo",
      text: "Tell me more about the AI website.",
      message_id: "email-provider-1",
      created_at: "2026-05-29T10:00:00.000Z",
    },
  });

  assert.deepEqual(replies, [
    {
      channel: "email",
      participantAddress: "sales@operator.com",
      subject: "Re: Mazex demo",
      body: "Tell me more about the AI website.",
      providerMessageId: "email-provider-1",
      receivedAt: new Date("2026-05-29T10:00:00.000Z"),
    },
  ]);
});

test("normalizePlatformWhatsAppWebhookPayload extracts Meta inbound messages", () => {
  const replies = normalizePlatformWhatsAppWebhookPayload({
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: "255 700 111 222",
                  id: "wamid.1",
                  timestamp: "1778222956",
                  text: { body: "STOP" },
                },
              ],
            },
          },
        ],
      },
    ],
  });

  assert.equal(replies.length, 1);
  assert.equal(replies[0].channel, "whatsapp");
  assert.equal(replies[0].participantAddress, "255700111222");
  assert.equal(replies[0].body, "STOP");
  assert.equal(replies[0].providerMessageId, "wamid.1");
  assert.equal(replies[0].receivedAt.toISOString(), "2026-05-08T06:49:16.000Z");
});
