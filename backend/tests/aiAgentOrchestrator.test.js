import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAgentActionPlan,
  buildAgentDecision,
  classifyAgentIntent,
  routeAgentEvent,
} from "../utils/aiAgentOrchestrator.js";

test("classifyAgentIntent detects price intent from social comments", () => {
  const intent = classifyAgentIntent({
    channel: "instagram",
    text: "Beautiful safari! price please?",
  });

  assert.equal(intent.primaryIntent, "pricing-interest");
  assert.equal(intent.buyingSignal, true);
});

test("routeAgentEvent sends social pricing interest to messaging sales agent", () => {
  const route = routeAgentEvent({
    channel: "instagram",
    text: "How much for Zanzibar beach and safari?",
  });

  assert.equal(route.primaryAgent, "messaging-sales-agent");
  assert.equal(route.supportingAgents.includes("crm-lead-agent"), true);
  assert.equal(route.nextAction, "invite-to-direct-conversation");
});

test("buildAgentDecision prioritizes hot WhatsApp leads for sales response", () => {
  const decision = buildAgentDecision({
    channel: "whatsapp",
    text: "We are 4 adults, July dates, budget $4000, need Serengeti and Ngorongoro.",
    lead: {
      destinations: ["Serengeti", "Ngorongoro"],
      tripLengthDays: 6,
      adults: 4,
      budget: "$4000",
      travelWhen: "July",
      contactPreference: "whatsapp",
      sourceChannel: "plan-my-trip",
      message: "We are 4 adults, July dates, budget $4000, need Serengeti and Ngorongoro.",
    },
  });

  assert.equal(decision.primaryAgent, "messaging-sales-agent");
  assert.equal(decision.leadTemperature, "hot");
  assert.equal(decision.priority, "urgent");
  assert.equal(decision.autoReplyAllowed, true);
  assert.equal(decision.guardrails.includes("never-invent-prices"), true);
});

test("buildAgentDecision routes cold email leads to nurture", () => {
  const decision = buildAgentDecision({
    channel: "email",
    text: "Maybe later, just browsing.",
    lead: {
      message: "Maybe later, just browsing.",
      contactPreference: "email",
      sourceChannel: "email",
    },
  });

  assert.equal(decision.primaryAgent, "email-nurture-agent");
  assert.equal(decision.leadTemperature, "cold");
  assert.equal(decision.nextAction, "schedule-nurture-follow-up");
});

test("buildAgentDecision flags low-confidence replies for human review", () => {
  const decision = buildAgentDecision({
    channel: "website-chat",
    text: "Can you confirm exact private jet pricing and legal visa guarantees?",
  });

  assert.equal(decision.requiresHumanReview, true);
  assert.equal(decision.autoReplyAllowed, false);
});

test("buildAgentActionPlan exposes concrete inbox operator actions", () => {
  const actions = buildAgentActionPlan({
    primaryAgent: "messaging-sales-agent",
    nextAction: "priority-sales-response",
    priority: "urgent",
    autoReplyAllowed: true,
    requiresHumanReview: false,
  });

  assert.equal(actions[0].type, "reply");
  assert.equal(actions[0].label, "Send priority sales reply");
  assert.equal(actions.some((action) => action.type === "follow-up"), true);
});

test("buildAgentDecision includes recommended actions for the admin UI", () => {
  const decision = buildAgentDecision({
    channel: "email",
    text: "Maybe later, just browsing.",
  });

  assert.equal(Array.isArray(decision.recommendedActions), true);
  assert.equal(decision.recommendedActions[0].type, "follow-up");
});
