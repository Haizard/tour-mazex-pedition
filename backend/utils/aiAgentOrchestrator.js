import { scoreInquiryLead } from "./leadScoring.js";

const SOCIAL_CHANNELS = new Set(["instagram", "facebook", "tiktok", "social", "social-post"]);
const MESSAGING_CHANNELS = new Set(["whatsapp", "messenger", "website-chat", "chat", "website"]);
const EMAIL_CHANNELS = new Set(["email", "email-thread"]);

const PRICING_TERMS = ["price", "cost", "how much", "budget", "rate", "quote", "payment"];
const BOOKING_TERMS = ["book", "available", "dates", "july", "august", "travel", "package", "itinerary"];
const HUMAN_REVIEW_TERMS = ["guarantee", "legal", "visa guarantee", "private jet pricing", "exact price"];

const normalizeText = (value = "") => value.toString().trim().toLowerCase();

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

const normalizeChannel = (channel = "") => {
  const value = normalizeText(channel).replace(/_/g, "-");
  if (value === "lead") return "website";
  if (value === "chat-conversation") return "website-chat";
  return value || "website";
};

export const classifyAgentIntent = ({ channel = "", text = "" } = {}) => {
  const normalizedChannel = normalizeChannel(channel);
  const normalizedText = normalizeText(text);
  const pricingInterest = includesAny(normalizedText, PRICING_TERMS);
  const bookingInterest = includesAny(normalizedText, BOOKING_TERMS);
  const needsHumanReview = includesAny(normalizedText, HUMAN_REVIEW_TERMS);

  let primaryIntent = "general-support";
  if (pricingInterest) {
    primaryIntent = "pricing-interest";
  } else if (bookingInterest) {
    primaryIntent = "booking-interest";
  } else if (SOCIAL_CHANNELS.has(normalizedChannel)) {
    primaryIntent = "social-engagement";
  } else if (EMAIL_CHANNELS.has(normalizedChannel)) {
    primaryIntent = "nurture-check-in";
  }

  return {
    channel: normalizedChannel,
    primaryIntent,
    buyingSignal: pricingInterest || bookingInterest,
    needsHumanReview,
  };
};

export const routeAgentEvent = ({ channel = "", text = "", leadTemperature = "" } = {}) => {
  const intent = classifyAgentIntent({ channel, text });
  const hotLead = leadTemperature === "hot";

  if (intent.needsHumanReview) {
    return {
      primaryAgent: "crm-lead-agent",
      supportingAgents: ["messaging-sales-agent"],
      nextAction: "human-review-required",
    };
  }

  if (SOCIAL_CHANNELS.has(intent.channel) && intent.buyingSignal) {
    return {
      primaryAgent: "messaging-sales-agent",
      supportingAgents: ["social-media-agent", "crm-lead-agent"],
      nextAction: "invite-to-direct-conversation",
    };
  }

  if (MESSAGING_CHANNELS.has(intent.channel) || hotLead) {
    return {
      primaryAgent: "messaging-sales-agent",
      supportingAgents: ["crm-lead-agent", "email-nurture-agent"],
      nextAction: hotLead ? "priority-sales-response" : "qualify-and-recommend-package",
    };
  }

  if (EMAIL_CHANNELS.has(intent.channel)) {
    return {
      primaryAgent: leadTemperature === "cold" ? "email-nurture-agent" : "crm-lead-agent",
      supportingAgents: ["crm-lead-agent"],
      nextAction: leadTemperature === "cold" ? "schedule-nurture-follow-up" : "review-lead-context",
    };
  }

  return {
    primaryAgent: "crm-lead-agent",
    supportingAgents: ["analytics-agent"],
    nextAction: "score-and-route-lead",
  };
};

export const buildAgentActionPlan = (decision = {}) => {
  if (decision.requiresHumanReview || decision.nextAction === "human-review-required") {
    return [
      {
        type: "review",
        label: "Send to human review",
        description: "Sensitive pricing, legal, or guarantee language needs operator approval.",
        urgency: "high",
      },
    ];
  }

  if (decision.primaryAgent === "email-nurture-agent") {
    return [
      {
        type: "follow-up",
        label: "Schedule nurture follow-up",
        description: "Keep the lead warm with a gentle email sequence.",
        urgency: "low",
      },
      {
        type: "tag",
        label: "Mark as nurture lead",
        description: "Keep this conversation in the CRM nurture queue.",
        urgency: "low",
      },
    ];
  }

  if (decision.nextAction === "invite-to-direct-conversation") {
    return [
      {
        type: "reply",
        label: "Invite to WhatsApp or Messenger",
        description: "Move public social interest into a direct sales conversation.",
        urgency: "normal",
      },
      {
        type: "score",
        label: "Create or update lead profile",
        description: "Capture the social buying signal in CRM.",
        urgency: "normal",
      },
    ];
  }

  if (decision.primaryAgent === "messaging-sales-agent") {
    return [
      {
        type: "reply",
        label: decision.priority === "urgent" ? "Send priority sales reply" : "Send sales qualification reply",
        description: "Respond with package guidance and collect dates, group size, and budget.",
        urgency: decision.priority === "urgent" ? "high" : "normal",
      },
      {
        type: "follow-up",
        label: "Prepare follow-up sequence",
        description: "Queue a follow-up if the traveler does not respond.",
        urgency: "normal",
      },
    ];
  }

  return [
    {
      type: "score",
      label: "Score and route lead",
      description: "Update the CRM profile and decide the next best channel.",
      urgency: "normal",
    },
  ];
};

export const buildAgentDecision = ({ channel = "", text = "", lead = {} } = {}) => {
  const scoring = scoreInquiryLead({
    ...lead,
    message: lead.message || text,
    contactPreference: lead.contactPreference || normalizeChannel(channel),
    sourceChannel: lead.sourceChannel || normalizeChannel(channel),
  });
  const intent = classifyAgentIntent({ channel, text: text || lead.message || "" });
  const route = routeAgentEvent({
    channel,
    text: text || lead.message || "",
    leadTemperature: scoring.leadTemperature,
  });
  const requiresHumanReview = intent.needsHumanReview;
  const urgent = scoring.leadTemperature === "hot" || route.nextAction === "priority-sales-response";

  const decision = {
    ...route,
    intent: intent.primaryIntent,
    buyingSignal: intent.buyingSignal,
    leadScore: scoring.leadScore,
    leadTemperature: scoring.leadTemperature,
    leadScoreReasons: scoring.leadScoreReasons,
    priority: requiresHumanReview ? "review" : urgent ? "urgent" : scoring.leadTemperature === "warm" ? "normal" : "low",
    autoReplyAllowed: !requiresHumanReview && route.primaryAgent !== "analytics-agent",
    requiresHumanReview,
    guardrails: [
      "use-shared-brand-tone",
      "never-invent-prices",
      "confirm-live-availability-before-promising",
      "route-sensitive-or-legal-claims-to-human",
    ],
  };

  return {
    ...decision,
    recommendedActions: buildAgentActionPlan(decision),
  };
};

export const enrichInboxItemWithAgentDecision = (item = {}) => ({
  ...item,
  agentDecision: buildAgentDecision({
    channel: item.channel,
    text: item.preview || item.title || "",
    lead: item.linkedInquiry || {
      message: item.preview,
      contactPreference: item.channel,
      sourceChannel: item.leadSource,
      status: item.conversionStage,
    },
  }),
});
