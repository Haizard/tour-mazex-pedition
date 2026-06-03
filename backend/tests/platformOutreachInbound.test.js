import test from "node:test";
import assert from "node:assert/strict";

import {
  buildInboundPlatformOutreachThreadUpdate,
  buildPlatformAutoReplyDecision,
} from "../utils/platformOutreachInbound.js";

test("buildInboundPlatformOutreachThreadUpdate marks opt-out replies and suppression updates", () => {
  const update = buildInboundPlatformOutreachThreadUpdate({
    channel: "email",
    body: "Please unsubscribe me",
    receivedAt: new Date("2026-05-29T10:00:00.000Z"),
  });

  assert.equal(update.threadStatus, "opted_out");
  assert.deepEqual(update.prospectUpdate, {
    status: "opted_out",
    emailOptOut: true,
  });
  assert.equal(update.message.status, "opted_out");
});

test("buildInboundPlatformOutreachThreadUpdate tracks normal replies for qualification", () => {
  const update = buildInboundPlatformOutreachThreadUpdate({
    channel: "whatsapp",
    body: "How does the AI chatbot work?",
    receivedAt: new Date("2026-05-29T10:00:00.000Z"),
  });

  assert.equal(update.threadStatus, "open");
  assert.deepEqual(update.prospectUpdate, {
    status: "replied",
    lastReplyAt: new Date("2026-05-29T10:00:00.000Z"),
  });
  assert.equal(update.message.status, "replied");
});

test("buildPlatformAutoReplyDecision escalates sensitive replies", () => {
  const decision = buildPlatformAutoReplyDecision({
    body: "Can you guarantee bookings and legal compliance?",
  });

  assert.equal(decision.action, "escalate");
  assert.equal(decision.requiresEscalation, true);
  assert.match(decision.reason, /sensitive term/i);
});

test("buildPlatformAutoReplyDecision drafts safe platform sales replies", () => {
  const decision = buildPlatformAutoReplyDecision({
    body: "How does your AI website help tour operators?",
  });

  assert.equal(decision.action, "draft_auto_reply");
  assert.equal(decision.requiresEscalation, false);
  assert.match(decision.replyBody, /Mazex/i);
  assert.match(decision.replyBody, /demo/i);
});

test("buildPlatformAutoReplyDecision honors configurable escalation rules", () => {
  const decision = buildPlatformAutoReplyDecision({
    body: "Your price is too high and I am angry about this.",
    escalationRules: [
      {
        label: "Commercial negotiation",
        keywords: ["price", "discount", "too high"],
        enabled: true,
      },
    ],
  });

  assert.equal(decision.action, "escalate");
  assert.equal(decision.requiresEscalation, true);
  assert.match(decision.reason, /Commercial negotiation/i);
});

test("buildPlatformAutoReplyDecision escalates low-confidence replies by threshold", () => {
  const decision = buildPlatformAutoReplyDecision({
    body: "",
    escalationRules: [
      {
        label: "Low confidence",
        keywords: [],
        enabled: true,
        minConfidence: 0.65,
      },
    ],
  });

  assert.equal(decision.action, "escalate");
  assert.match(decision.reason, /Low confidence/i);
});
