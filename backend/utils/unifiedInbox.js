import { enrichInboxItemWithAgentDecision } from "./aiAgentOrchestrator.js";

const toTimestamp = (value) => {
  const timestamp = new Date(value || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const buildWhatsAppAutomationSnapshot = (current = {}, delivery = {}) => ({
  outboundMessageCount: Number(current.outboundMessageCount || 0) + 1,
  lastMessageAt: delivery.sentAt ? new Date(delivery.sentAt) : new Date(),
  lastMessagePreview: (delivery.message || "").slice(0, 280),
  lastExternalMessageId: delivery.externalMessageId || "",
  lastDeliveryStatus: delivery.status || "sent",
});

const resolveRevenuePriority = (value = "") => {
  const normalized = String(value || "").toLowerCase();

  if (["booked", "qualified", "accepted", "pending"].includes(normalized)) {
    return "high";
  }

  if (["contacted", "follow-up", "follow_up", "read", "open"].includes(normalized)) {
    return "medium";
  }

  return "normal";
};

const normalizeEmailThreadItem = (thread = {}) => ({
  id: `email-${thread._id}`,
  sourceId: String(thread._id),
  sourceType: "email-thread",
  channel: "email",
  channelLabel: "Email",
  title: thread.subject || "Email thread",
  contactName:
    thread.linkedInquiry?.name ||
    thread.linkedContactMessage?.name ||
    thread.participants?.[0] ||
    "Unknown contact",
  contactAddress: thread.participants?.[0] || "",
  status: thread.status || "open",
  preview:
    thread.previewText ||
    thread.linkedInquiry?.message ||
    thread.linkedContactMessage?.message ||
    "",
  linkedInquiry: thread.linkedInquiry || null,
  linkedContactMessage: thread.linkedContactMessage || null,
  leadSource: thread.linkedInquiry?.sourceChannel || "email",
  campaignLabel:
    thread.linkedInquiry?.campaignLabel ||
    thread.metadata?.campaignLabel ||
    "",
  conversionStage: thread.linkedInquiry?.leadStage || thread.status || "open",
  canReply: true,
  canFollowUp: ["open", "pending"].includes(String(thread.status || "open").toLowerCase()),
  canEscalate: true,
  requiresHumanReview: false,
  assignedTo: null,
  revenuePriority: resolveRevenuePriority(thread.linkedInquiry?.leadStage || thread.status),
  lastActivityAt: thread.lastMessageAt || thread.updatedAt || thread.createdAt || null,
});

const normalizeInquiryItem = (inquiry = {}) => ({
  id: `inquiry-${inquiry._id}`,
  sourceId: String(inquiry._id),
  sourceType: "inquiry",
  channel: inquiry.contactPreference === "whatsapp" ? "whatsapp" : "lead",
  channelLabel: inquiry.contactPreference === "whatsapp" ? "WhatsApp Lead" : "Lead Inquiry",
  title: inquiry.destinations?.length
    ? `${inquiry.destinations.join(", ")} inquiry`
    : "New inquiry",
  contactName: inquiry.name || `${inquiry.firstName || ""} ${inquiry.lastName || ""}`.trim(),
  contactAddress: inquiry.phone || inquiry.email || "",
  status: inquiry.status || "Pending",
  preview: inquiry.followUpMessage || inquiry.automationSummary || inquiry.message || "",
  linkedInquiry: inquiry,
  linkedContactMessage: null,
  whatsappAutomation: inquiry.whatsappAutomation || null,
  leadSource: inquiry.sourceChannel || inquiry.contactPreference || "website",
  campaignLabel: inquiry.campaignLabel || "",
  conversionStage: inquiry.leadStage || inquiry.status || "new",
  canReply: Boolean(inquiry.phone || inquiry.email),
  canFollowUp: !["booked", "closed", "cancelled"].includes(
    String(inquiry.leadStage || inquiry.status || "").toLowerCase()
  ),
  canEscalate: true,
  requiresHumanReview: false,
  assignedTo: null,
  revenuePriority: resolveRevenuePriority(inquiry.leadStage || inquiry.status),
  lastActivityAt:
    inquiry.whatsappAutomation?.lastMessageAt ||
    inquiry.updatedAt ||
    inquiry.createdAt ||
    null,
});

const normalizeContactMessageItem = (message = {}) => ({
  id: `website-${message._id}`,
  sourceId: String(message._id),
  sourceType: "contact-message",
  channel: "website",
  channelLabel: "Website Form",
  title: "Website contact message",
  contactName: message.name || "Website visitor",
  contactAddress: message.email || message.phone || "",
  status: message.status || "New",
  preview: message.message || "",
  linkedInquiry: null,
  linkedContactMessage: message,
  whatsappAutomation: null,
  leadSource: "website",
  campaignLabel: "",
  conversionStage: message.status || "New",
  canReply: Boolean(message.email || message.phone),
  canFollowUp: !["replied", "closed"].includes(String(message.status || "").toLowerCase()),
  canEscalate: true,
  requiresHumanReview: false,
  assignedTo: null,
  revenuePriority: resolveRevenuePriority(message.status),
  lastActivityAt: message.updatedAt || message.createdAt || null,
});

const normalizeChatConversationItem = (conversation = {}) => ({
  id: `chat-${conversation._id}`,
  sourceId: String(conversation._id),
  sourceType: "chat-conversation",
  channel: "website",
  channelLabel: "Website Chat",
  title: "Live chat conversation",
  contactName: conversation.visitorLabel || "Website Visitor",
  contactAddress: conversation.visitorEmail || conversation.visitorPhone || "",
  status: conversation.status || "new",
  preview:
    conversation.lastVisitorMessage ||
    conversation.transcript?.[conversation.transcript.length - 1]?.content ||
    "",
  linkedInquiry: null,
  linkedContactMessage: null,
  linkedChatConversation: conversation,
  whatsappAutomation: null,
  leadSource: conversation.sourceChannel || "website-chat",
  campaignLabel: conversation.metadata?.campaignLabel || "",
  conversionStage: conversation.status || "new",
  canReply: Boolean(conversation.visitorEmail || conversation.visitorPhone),
  canFollowUp: !["closed", "archived"].includes(String(conversation.status || "").toLowerCase()),
  canEscalate: true,
  requiresHumanReview: false,
  assignedTo: null,
  revenuePriority: resolveRevenuePriority(conversation.status),
  lastActivityAt: conversation.lastActivityAt || conversation.updatedAt || conversation.createdAt || null,
});

export const buildUnifiedInboxItems = ({
  emailThreads = [],
  inquiries = [],
  contactMessages = [],
  chatConversations = [],
} = {}) =>
  [
    ...emailThreads.map(normalizeEmailThreadItem),
    ...inquiries.map(normalizeInquiryItem),
    ...contactMessages.map(normalizeContactMessageItem),
    ...chatConversations.map(normalizeChatConversationItem),
  ]
    .map(enrichInboxItemWithAgentDecision)
    .map((item) => ({
      ...item,
      requiresHumanReview: Boolean(item.requiresHumanReview || item.agentDecision?.requiresHumanReview),
      assignedTo: item.assignedTo || null,
      canFollowUp: Boolean(item.canFollowUp),
      canEscalate: Boolean(item.canEscalate),
      revenuePriority: item.revenuePriority || resolveRevenuePriority(item.conversionStage || item.status),
    }))
    .sort((left, right) => toTimestamp(right.lastActivityAt) - toTimestamp(left.lastActivityAt));

