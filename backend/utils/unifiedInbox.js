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
  lastActivityAt:
    inquiry.whatsappAutomation?.lastMessageAt ||
    inquiry.updatedAt ||
    inquiry.createdAt ||
    null,
});

export const buildUnifiedInboxItems = ({
  emailThreads = [],
  inquiries = [],
} = {}) =>
  [
    ...emailThreads.map(normalizeEmailThreadItem),
    ...inquiries.map(normalizeInquiryItem),
  ].sort((left, right) => toTimestamp(right.lastActivityAt) - toTimestamp(left.lastActivityAt));

