import test from "node:test";
import assert from "node:assert/strict";

import {
  buildUnifiedInboxItems,
  buildWhatsAppAutomationSnapshot,
} from "../utils/unifiedInbox.js";

test("buildUnifiedInboxItems merges email threads and inquiries into a recency-sorted inbox feed", () => {
  const items = buildUnifiedInboxItems({
    emailThreads: [
      {
        _id: "thread-1",
        subject: "Safari quote follow-up",
        participants: ["guest@example.com"],
        status: "open",
        lastMessageAt: "2026-04-20T10:00:00.000Z",
      },
    ],
    inquiries: [
      {
        _id: "inquiry-1",
        name: "Anna Safari",
        email: "anna@example.com",
        contactPreference: "whatsapp",
        status: "Pending",
        followUpMessage: "We can send two migration options today.",
        createdAt: "2026-04-21T09:00:00.000Z",
        whatsappAutomation: {
          lastMessageAt: "2026-04-21T12:00:00.000Z",
          lastDeliveryStatus: "sent",
        },
      },
    ],
    contactMessages: [
      {
        _id: "website-1",
        name: "Website Visitor",
        email: "visitor@example.com",
        status: "New",
        message: "Can someone help me plan a Serengeti safari?",
        createdAt: "2026-04-19T09:00:00.000Z",
      },
    ],
    chatConversations: [
      {
        _id: "chat-1",
        visitorLabel: "Live Chat Guest",
        visitorEmail: "chat@example.com",
        status: "new",
        lastVisitorMessage: "Do you have availability for July?",
        lastActivityAt: "2026-04-22T12:30:00.000Z",
      },
    ],
  });

  assert.equal(items.length, 4);
  assert.equal(items[0].channel, "website");
  assert.equal(items[0].sourceId, "chat-1");
  assert.equal(items[1].channel, "whatsapp");
  assert.equal(items[1].sourceId, "inquiry-1");
  assert.equal(items[2].channel, "email");
  assert.equal(items[2].sourceId, "thread-1");
  assert.equal(items[3].channel, "website");
  assert.equal(items[3].sourceId, "website-1");
});

test("buildWhatsAppAutomationSnapshot increments counters and records delivery state", () => {
  const snapshot = buildWhatsAppAutomationSnapshot(
    {
      outboundMessageCount: 1,
    },
    {
      message: "Hello from MAZ",
      externalMessageId: "wamid.abc123",
      status: "sent",
      sentAt: "2026-04-25T08:30:00.000Z",
    }
  );

  assert.equal(snapshot.outboundMessageCount, 2);
  assert.equal(snapshot.lastDeliveryStatus, "sent");
  assert.equal(snapshot.lastExternalMessageId, "wamid.abc123");
  assert.equal(snapshot.lastMessagePreview.includes("Hello from MAZ"), true);
});

test("buildUnifiedInboxItems exposes conversion metadata for operator workflows", () => {
  const items = buildUnifiedInboxItems({
    inquiries: [
      {
        _id: "inquiry-9",
        name: "Lulu Traveler",
        email: "lulu@example.com",
        phone: "+255700000000",
        contactPreference: "email",
        status: "Contacted",
        sourceChannel: "chatbot",
        leadStage: "qualified",
        updatedAt: "2026-04-23T09:00:00.000Z",
      },
    ],
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].leadSource, "chatbot");
  assert.equal(items[0].conversionStage, "qualified");
  assert.equal(items[0].canReply, true);
  assert.equal(items[0].canEscalate, true);
});
