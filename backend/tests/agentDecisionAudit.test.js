import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildAgentDecisionAuditRecord,
  buildAgentRecommendedActionRecord,
} from "../utils/agentDecisionAudit.js";

const baseItem = {
  id: "inquiry-lead-1",
  sourceId: "lead-1",
  sourceType: "inquiry",
  channel: "whatsapp",
  title: "Serengeti inquiry",
  contactName: "Asha Traveler",
  contactAddress: "+255700000000",
  preview: "How much is a July safari package?",
  leadSource: "instagram",
  conversionStage: "qualified",
};

const baseDecision = {
  primaryAgent: "messaging-sales-agent",
  supportingAgents: ["crm-lead-agent"],
  nextAction: "priority-sales-response",
  intent: "pricing-interest",
  buyingSignal: true,
  leadScore: 82,
  leadTemperature: "hot",
  priority: "urgent",
  autoReplyAllowed: true,
  requiresHumanReview: false,
  recommendedActions: [
    {
      type: "reply",
      label: "Send priority sales reply",
      description: "Respond with package guidance.",
      urgency: "high",
    },
  ],
  guardrails: ["never-invent-prices"],
};

test("buildAgentDecisionAuditRecord creates a stable audit envelope for an inbox decision", () => {
  const record = buildAgentDecisionAuditRecord({
    tenantId: "tenant-1",
    item: baseItem,
    decision: baseDecision,
    decidedAt: "2026-05-06T10:00:00.000Z",
  });

  assert.equal(record.tenantId, "tenant-1");
  assert.equal(record.sourceType, "inquiry");
  assert.equal(record.sourceId, "lead-1");
  assert.equal(record.channel, "whatsapp");
  assert.equal(record.contactName, "Asha Traveler");
  assert.equal(record.primaryAgent, "messaging-sales-agent");
  assert.equal(record.nextAction, "priority-sales-response");
  assert.equal(record.leadTemperature, "hot");
  assert.equal(record.priority, "urgent");
  assert.equal(record.status, "recommended");
  assert.equal(record.decisionHash.length, 64);
  assert.deepEqual(record.guardrails, ["never-invent-prices"]);
});

test("buildAgentRecommendedActionRecord converts one recommended action into an operator log entry", () => {
  const record = buildAgentRecommendedActionRecord({
    tenantId: "tenant-1",
    item: baseItem,
    decision: baseDecision,
    action: baseDecision.recommendedActions[0],
    actionIndex: 0,
    status: "accepted",
    operatorNote: "Handled in WhatsApp.",
    decidedAt: "2026-05-06T10:00:00.000Z",
  });

  assert.equal(record.eventType, "recommended-action");
  assert.equal(record.actionType, "reply");
  assert.equal(record.actionLabel, "Send priority sales reply");
  assert.equal(record.actionUrgency, "high");
  assert.equal(record.status, "accepted");
  assert.equal(record.operatorNote, "Handled in WhatsApp.");
  assert.equal(record.actionKey, "lead-1:reply:0");
  assert.equal(record.decisionSnapshot.primaryAgent, "messaging-sales-agent");
});
