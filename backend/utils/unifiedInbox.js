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

const normalizeEmailThreadItem = (thread = {}) => ({
  id: `email-${thread._id}`,
  sourceId: String(thread._id),
  sourceType: "email-thread",
  channel: "email",
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
  conversionStage: thread.linkedInquiry?.leadStage || thread.status || "open",
  canReply: true,
  canEscalate: true,
  lastActivityAt: thread.lastMessageAt || thread.updatedAt || thread.createdAt || null,
});

const normalizeInquiryItem = (inquiry = {}) => ({
  id: `inquiry-${inquiry._id}`,
  sourceId: String(inquiry._id),
  sourceType: "inquiry",
  channel: inquiry.contactPreference === "whatsapp" ? "whatsapp" : "lead",
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
  conversionStage: inquiry.leadStage || inquiry.status || "new",
  canReply: Boolean(inquiry.phone || inquiry.email),
  canEscalate: true,
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
  title: "Website contact message",
  contactName: message.name || "Website visitor",
  contactAddress: message.email || message.phone || "",
  status: message.status || "New",
  preview: message.message || "",
  linkedInquiry: null,
  linkedContactMessage: message,
  whatsappAutomation: null,
  leadSource: "website",
  conversionStage: message.status || "New",
  canReply: Boolean(message.email || message.phone),
  canEscalate: true,
  lastActivityAt: message.updatedAt || message.createdAt || null,
});

const normalizeChatConversationItem = (conversation = {}) => ({
  id: `chat-${conversation._id}`,
  sourceId: String(conversation._id),
  sourceType: "chat-conversation",
  channel: "website",
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
  leadSource: "website-chat",
  conversionStage: conversation.status || "new",
  canReply: Boolean(conversation.visitorEmail || conversation.visitorPhone),
  canEscalate: true,
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
    .sort((left, right) => toTimestamp(right.lastActivityAt) - toTimestamp(left.lastActivityAt));

