import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import CustomInquiry from "../models/CustomInquiry.js";
import EmailProviderConnection from "../models/EmailProviderConnection.js";
import EmailSyncJob from "../models/EmailSyncJob.js";
import EmailThread from "../models/EmailThread.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import {
  buildEmailConnectionPayload,
  buildConnectionHealthSnapshot,
  buildSyncJobSnapshot,
  getEmailProviderCatalog,
} from "../utils/emailProviderService.js";

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

router.get("/providers", requireTenantAdmin, async (_req, res) => {
  try {
    res.status(200).json({ providers: getEmailProviderCatalog() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/connections", requireTenantAdmin, async (req, res) => {
  try {
    const connections = await EmailProviderConnection.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(
      connections.map((connection) => ({
        ...connection,
        encryptedAccessToken: connection.encryptedAccessToken ? "[stored]" : "",
        encryptedRefreshToken: connection.encryptedRefreshToken ? "[stored]" : "",
        encryptedApiKey: connection.encryptedApiKey ? "[stored]" : "",
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/connections", requireTenantAdmin, async (req, res) => {
  try {
    const connection = await EmailProviderConnection.create({
      tenantId: req.tenantId,
      ...buildEmailConnectionPayload(req.body),
    });

    res.status(201).json(connection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/connections/:connectionId/health-check", requireTenantAdmin, async (req, res) => {
  try {
    const connection = await EmailProviderConnection.findOne({
      _id: req.params.connectionId,
      tenantId: req.tenantId,
    });

    if (!connection) {
      return res.status(404).json({ message: "Connection not found." });
    }

    const health = buildConnectionHealthSnapshot(connection.toObject());

    connection.status = health.status;
    connection.lastSyncedAt = health.ok ? new Date() : connection.lastSyncedAt;
    connection.metadata = {
      ...(connection.metadata || {}),
      healthCheck: health,
    };

    await connection.save();

    res.status(200).json({
      connection: {
        ...connection.toObject(),
        encryptedAccessToken: connection.encryptedAccessToken ? "[stored]" : "",
        encryptedRefreshToken: connection.encryptedRefreshToken ? "[stored]" : "",
        encryptedApiKey: connection.encryptedApiKey ? "[stored]" : "",
      },
      health,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/threads", requireTenantAdmin, async (req, res) => {
  try {
    const threads = await EmailThread.find({ tenantId: req.tenantId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const [inquiries, messages] = await Promise.all([
      CustomInquiry.find({ tenantId: req.tenantId })
        .select("_id name email status createdAt")
        .lean(),
      ContactMessage.find({ tenantId: req.tenantId })
        .select("_id name email status createdAt")
        .lean(),
    ]);

    const inquiryLookup = Object.fromEntries(
      inquiries.map((inquiry) => [String(inquiry._id), inquiry])
    );
    const messageLookup = Object.fromEntries(
      messages.map((message) => [String(message._id), message])
    );

    res.status(200).json(
      threads.map((thread) => {
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
          linkedInquiry: thread.inquiryId
            ? inquiryLookup[String(thread.inquiryId)] || null
            : null,
          linkedContactMessage: thread.contactMessageId
            ? messageLookup[String(thread.contactMessageId)] || null
            : null,
          supportMatches: {
            inquiries: suggestedInquiries,
            contactMessages: suggestedMessages,
          },
        };
      })
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/sync-jobs", requireTenantAdmin, async (req, res) => {
  try {
    const jobs = await EmailSyncJob.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/threads", requireTenantAdmin, async (req, res) => {
  try {
    const thread = await EmailThread.create({
      tenantId: req.tenantId,
      connectionId: req.body.connectionId,
      providerThreadId: req.body.providerThreadId,
      subject: req.body.subject || "",
      participants: normalizeParticipantEmails(req.body.participants || []),
      inquiryId: req.body.inquiryId || null,
      contactMessageId: req.body.contactMessageId || null,
      status: req.body.status || "open",
      mailboxFolder: req.body.mailboxFolder || "inbox",
      previewText: req.body.previewText || "",
      lastMessageAt: req.body.lastMessageAt || new Date(),
      aiDraftStatus: req.body.aiDraftStatus || "none",
      metadata: {
        syncStrategy: "future-provider-sync",
        ...(req.body.metadata || {}),
      },
    });

    res.status(201).json(thread);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/threads/:threadId/link", requireTenantAdmin, async (req, res) => {
  try {
    const thread = await EmailThread.findOne({
      _id: req.params.threadId,
      tenantId: req.tenantId,
    });

    if (!thread) {
      return res.status(404).json({ message: "Thread not found." });
    }

    let nextInquiryId = req.body.inquiryId ?? thread.inquiryId;
    let nextContactMessageId = req.body.contactMessageId ?? thread.contactMessageId;

    if (nextInquiryId) {
      const inquiry = await CustomInquiry.findOne({
        _id: nextInquiryId,
        tenantId: req.tenantId,
      }).select("_id");

      if (!inquiry) {
        return res.status(404).json({ message: "Linked inquiry not found." });
      }
    }

    if (nextContactMessageId) {
      const message = await ContactMessage.findOne({
        _id: nextContactMessageId,
        tenantId: req.tenantId,
      }).select("_id");

      if (!message) {
        return res.status(404).json({ message: "Linked contact message not found." });
      }
    }

    thread.inquiryId = nextInquiryId || null;
    thread.contactMessageId = nextContactMessageId || null;
    await thread.save();

    res.status(200).json({ thread });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/connections/:connectionId/sync", requireTenantAdmin, async (req, res) => {
  try {
    const connection = await EmailProviderConnection.findOne({
      _id: req.params.connectionId,
      tenantId: req.tenantId,
    });

    if (!connection) {
      return res.status(404).json({ message: "Connection not found." });
    }

    const snapshot = buildSyncJobSnapshot(connection.toObject());
    const job = await EmailSyncJob.create({
      tenantId: req.tenantId,
      connectionId: connection._id,
      provider: connection.provider,
      ...snapshot,
    });

    connection.metadata = {
      ...(connection.metadata || {}),
      lastSyncJob: {
        id: job._id,
        status: job.status,
        completedAt: job.completedAt,
        resultSummary: job.resultSummary,
      },
    };
    connection.lastSyncedAt = job.completedAt;
    await connection.save();

    res.status(201).json({ job });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
