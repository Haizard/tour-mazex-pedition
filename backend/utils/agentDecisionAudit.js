import crypto from "node:crypto";

const normalizeDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const stableStringify = (value) => {
  if (!value || typeof value !== "object") {
    return JSON.stringify(value ?? null);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
};

export const createDecisionHash = (payload = {}) =>
  crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");

export const buildAgentDecisionAuditRecord = ({
  tenantId,
  item = {},
  decision = {},
  decidedAt,
  status = "recommended",
} = {}) => {
  const timestamp = normalizeDate(decidedAt);
  const decisionSnapshot = {
    primaryAgent: decision.primaryAgent || "crm-lead-agent",
    supportingAgents: decision.supportingAgents || [],
    nextAction: decision.nextAction || "score-and-route-lead",
    intent: decision.intent || "general-support",
    buyingSignal: Boolean(decision.buyingSignal),
    leadScore: Number(decision.leadScore || 0),
    leadTemperature: decision.leadTemperature || "cold",
    priority: decision.priority || "low",
    autoReplyAllowed: Boolean(decision.autoReplyAllowed),
    requiresHumanReview: Boolean(decision.requiresHumanReview),
    recommendedActions: decision.recommendedActions || [],
    guardrails: decision.guardrails || [],
  };

  return {
    eventType: "decision",
    tenantId,
    sourceType: item.sourceType || "unknown",
    sourceId: String(item.sourceId || item.id || ""),
    inboxItemId: item.id || "",
    channel: item.channel || "website",
    title: item.title || "",
    contactName: item.contactName || "",
    contactAddress: item.contactAddress || "",
    preview: item.preview || "",
    leadSource: item.leadSource || "",
    conversionStage: item.conversionStage || "",
    primaryAgent: decisionSnapshot.primaryAgent,
    nextAction: decisionSnapshot.nextAction,
    leadScore: decisionSnapshot.leadScore,
    leadTemperature: decisionSnapshot.leadTemperature,
    priority: decisionSnapshot.priority,
    status,
    guardrails: decisionSnapshot.guardrails,
    decisionSnapshot,
    decisionHash: createDecisionHash({
      tenantId,
      sourceType: item.sourceType,
      sourceId: item.sourceId || item.id,
      decisionSnapshot,
    }),
    decidedAt: timestamp,
  };
};

export const buildAgentRecommendedActionRecord = ({
  tenantId,
  item = {},
  decision = {},
  action = {},
  actionIndex = 0,
  status = "recommended",
  operatorNote = "",
  decidedAt,
} = {}) => {
  const baseRecord = buildAgentDecisionAuditRecord({
    tenantId,
    item,
    decision,
    decidedAt,
    status,
  });

  return {
    ...baseRecord,
    eventType: "recommended-action",
    actionType: action.type || "score",
    actionLabel: action.label || "Score and route lead",
    actionDescription: action.description || "",
    actionUrgency: action.urgency || "normal",
    actionIndex,
    actionKey: `${baseRecord.sourceId}:${action.type || "score"}:${actionIndex}`,
    operatorNote,
  };
};
