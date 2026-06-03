import { classifyOptOutIntent } from "./platformOutreachCompliance.js";
import { classifyPlatformReplyIntent } from "./platformOutreachGeneration.js";

export const buildInboundPlatformOutreachThreadUpdate = ({
  channel = "email",
  body = "",
  subject = "",
  receivedAt = new Date(),
  providerMessageId = "",
} = {}) => {
  const optOut = classifyOptOutIntent(body) === "opt_out";
  const message = {
    channel,
    direction: "inbound",
    subject,
    body: String(body || "").trim(),
    status: optOut ? "opted_out" : "replied",
    providerMessageId,
    receivedAt: new Date(receivedAt),
  };

  if (optOut) {
    return {
      threadStatus: "opted_out",
      message,
      prospectUpdate: channel === "whatsapp"
        ? { status: "opted_out", whatsappOptInStatus: "opted_out" }
        : { status: "opted_out", emailOptOut: true },
    };
  }

  return {
    threadStatus: "open",
    message,
    prospectUpdate: {
      status: "replied",
      lastReplyAt: new Date(receivedAt),
    },
  };
};

export const buildPlatformAutoReplyDecision = ({
  body = "",
  prospect = {},
  campaign = {},
  escalationRules = [],
} = {}) => {
  const normalizedBody = String(body || "").toLowerCase();
  const matchedRule = (escalationRules || []).find((rule) => {
    if (rule?.enabled === false) return false;
    return (rule?.keywords || []).some((keyword) =>
      normalizedBody.includes(String(keyword || "").toLowerCase())
    );
  });

  if (matchedRule) {
    return {
      action: "escalate",
      requiresEscalation: true,
      reason: `Matched escalation rule: ${matchedRule.label}.`,
      confidence: Number(matchedRule.minConfidence || 0.65),
      replyBody: "",
    };
  }

  const classification = classifyPlatformReplyIntent(body);

  if (classification.requiresEscalation) {
    return {
      action: "escalate",
      requiresEscalation: true,
      reason: classification.reason,
      confidence: classification.confidence,
      replyBody: "",
    };
  }

  const confidenceThreshold = Math.max(
    0,
    ...(escalationRules || [])
      .filter((rule) => rule?.enabled !== false)
      .map((rule) => Number(rule?.minConfidence || 0))
  );

  if (confidenceThreshold > 0 && classification.confidence < confidenceThreshold) {
    return {
      action: "escalate",
      requiresEscalation: true,
      reason: `Low confidence reply decision (${classification.confidence}) below threshold ${confidenceThreshold}.`,
      confidence: classification.confidence,
      replyBody: "",
    };
  }

  const companyName = prospect.companyName || "there";
  const campaignOffer = campaign.offer || "AI website, lead capture, marketplace visibility, and follow-up automation";

  return {
    action: "draft_auto_reply",
    requiresEscalation: false,
    reason: "",
    confidence: classification.confidence,
    replyBody: `Hi ${companyName}, Mazex helps tour operators with ${campaignOffer}. The best next step is a short demo so we can show how the platform fits your current website, lead flow, and sales follow-up process.`,
  };
};
