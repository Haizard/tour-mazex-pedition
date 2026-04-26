import express from "express";

import ContactMessage from "../models/ContactMessage.js";
import CustomInquiry from "../models/CustomInquiry.js";
import ChatConversation from "../models/ChatConversation.js";
import EmailThread from "../models/EmailThread.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { buildUnifiedInboxItems } from "../utils/unifiedInbox.js";

const router = express.Router();

const normalizeParticipantEmails = (participants = []) =>
  (participants || [])
    .map((participant) => {
      if (typeof participant === "string") {
        return participant.trim().toLowerCase();
      }

      if (participant && typeof participant.email === "string") {
        return participant.email.trim().toLowerCase();
      }

      return "";
    })
    .filter(Boolean);

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("unified-inbox"));

router.get("/", async (req, res) => {
  try {
    const [threads, inquiries, messages, chatConversations] = await Promise.all([
      EmailThread.find({ tenantId: req.tenantId })
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean(),
      CustomInquiry.find({ tenantId: req.tenantId })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
      ContactMessage.find({ tenantId: req.tenantId })
        .select("_id name email status createdAt message")
        .lean(),
      ChatConversation.find({ tenantId: req.tenantId })
        .sort({ lastActivityAt: -1, updatedAt: -1 })
        .lean(),
    ]);

    const inquiryLookup = Object.fromEntries(
      inquiries.map((inquiry) => [String(inquiry._id), inquiry])
    );
    const messageLookup = Object.fromEntries(
      messages.map((message) => [String(message._id), message])
    );

    const decoratedThreads = threads.map((thread) => {
      const participantEmails = normalizeParticipantEmails(thread.participants);
      const suggestedInquiries = inquiries.filter((inquiry) =>
        participantEmails.includes(inquiry.email?.trim().toLowerCase())
      );
      const suggestedMessages = messages.filter((message) =>
        participantEmails.includes(message.email?.trim().toLowerCase())
      );

      return {
        ...thread,
        participants: participantEmails,
        linkedInquiry: thread.inquiryId ? inquiryLookup[String(thread.inquiryId)] || null : null,
        linkedContactMessage: thread.contactMessageId
          ? messageLookup[String(thread.contactMessageId)] || null
          : null,
        supportMatches: {
          inquiries: suggestedInquiries,
          contactMessages: suggestedMessages,
        },
      };
    });

    const inboxItems = buildUnifiedInboxItems({
      emailThreads: decoratedThreads,
      inquiries,
      contactMessages: messages,
      chatConversations,
    });

    res.status(200).json({
      items: inboxItems,
      counts: {
        total: inboxItems.length,
        whatsapp: inboxItems.filter((item) => item.channel === "whatsapp").length,
        email: inboxItems.filter((item) => item.channel === "email").length,
        website: inboxItems.filter((item) => item.channel === "website").length,
        open: inboxItems.filter((item) =>
          ["open", "pending", "Pending", "Contacted", "New", "Read", "new", "open"].includes(item.status)
        ).length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
