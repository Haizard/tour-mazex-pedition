import express from "express";
import PlatformOutreachCampaign from "../models/PlatformOutreachCampaign.js";
import PlatformOutreachMessage from "../models/PlatformOutreachMessage.js";
import PlatformOutreachProspect from "../models/PlatformOutreachProspect.js";
import PlatformOutreachSettings from "../models/PlatformOutreachSettings.js";
import PlatformOutreachThread from "../models/PlatformOutreachThread.js";
import PlatformSocialPost from "../models/PlatformSocialPost.js";
import { requirePlatformAdmin } from "../middleware/platformAdminAuthMiddleware.js";
import {
  buildPlatformProspectPayload,
  buildProspectDuplicateQuery,
} from "../utils/platformOutreachProspects.js";
import { generatePlatformOutreachWithLlm } from "../utils/platformOutreachGeneration.js";
import { recordPlatformOutreachEvent } from "../utils/platformOutreachEventLog.js";
import {
  buildInboundPlatformOutreachThreadUpdate,
  buildPlatformAutoReplyDecision,
} from "../utils/platformOutreachInbound.js";
import { resolvePlatformOutreachReadiness } from "../utils/platformOutreachProviders.js";

const router = express.Router();

router.use(requirePlatformAdmin);

const getSettings = async () =>
  PlatformOutreachSettings.findOneAndUpdate(
    { singletonKey: "platform-outreach" },
    { $setOnInsert: { singletonKey: "platform-outreach" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

const buildSettingsPayload = (body = {}) => ({
  email: {
    senderName: body.email?.senderName || "",
    senderEmail: body.email?.senderEmail || "",
    postalAddress: body.email?.postalAddress || "",
    unsubscribeBaseUrl: body.email?.unsubscribeBaseUrl || "",
  },
  whatsapp: {
    businessAccountId: body.whatsapp?.businessAccountId || "",
    phoneNumberId: body.whatsapp?.phoneNumberId || "",
    defaultMarketingTemplateName: body.whatsapp?.defaultMarketingTemplateName || "",
    webhookVerifyToken: body.whatsapp?.webhookVerifyToken || "",
  },
  social: {
    facebookPageId: body.social?.facebookPageId || "",
    instagramBusinessAccountId: body.social?.instagramBusinessAccountId || "",
  },
  rateLimits: {
    maxEmailPerHour: Number(body.rateLimits?.maxEmailPerHour || 50),
    maxWhatsAppPerHour: Number(body.rateLimits?.maxWhatsAppPerHour || 20),
    maxSocialPostsPerDay: Number(body.rateLimits?.maxSocialPostsPerDay || 10),
  },
});

router.get("/settings/readiness", async (req, res) => {
  const settings = await getSettings();
  const readiness = resolvePlatformOutreachReadiness({
    settings,
    channels: ["email", "whatsapp", "facebook", "instagram"],
    env: process.env,
  });
  await recordPlatformOutreachEvent({
    event: {
      eventType: readiness.ready ? "provider_readiness_checked" : "provider_readiness_failed",
      req,
      summary: readiness.ready
        ? "Platform outreach provider readiness check passed."
        : "Platform outreach provider readiness check failed.",
      metadata: {
        ready: readiness.ready,
        missing: readiness.missing || [],
      },
    },
  });
  res.status(200).json({
    readiness,
    settings,
  });
});

router.patch("/settings", async (req, res) => {
  const payload = buildSettingsPayload(req.body);
  const settings = await PlatformOutreachSettings.findOneAndUpdate(
    { singletonKey: "platform-outreach" },
    { $set: payload, $setOnInsert: { singletonKey: "platform-outreach" } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
  const readiness = resolvePlatformOutreachReadiness({
    settings,
    channels: ["email", "whatsapp", "facebook", "instagram"],
    env: process.env,
  });
  await recordPlatformOutreachEvent({
    event: {
      eventType: "settings_updated",
      req,
      summary: "Platform outreach settings updated.",
      metadata: {
        readinessReady: readiness.ready,
        missing: readiness.checks?.flatMap((check) => check.missing || []) || [],
      },
    },
  });
  return res.status(200).json({ settings, readiness });
});

router.get("/prospects", async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  const prospects = await PlatformOutreachProspect.find(query)
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean();
  res.status(200).json(prospects);
});

router.post("/prospects", async (req, res) => {
  const payload = buildPlatformProspectPayload(req.body);
  const prospect = await PlatformOutreachProspect.findOneAndUpdate(
    buildProspectDuplicateQuery(payload),
    { $set: payload },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await recordPlatformOutreachEvent({
    event: {
      eventType: "prospect_saved",
      req,
      prospectId: prospect._id,
      summary: `Prospect saved: ${prospect.companyName}.`,
      metadata: {
        sourceUrl: prospect.sourceUrl,
        contactChannels: [prospect.email ? "email" : "", prospect.whatsappNumber ? "whatsapp" : ""].filter(Boolean),
      },
    },
  });
  res.status(201).json(prospect);
});

router.post("/prospects/import", async (req, res) => {
  const rows = Array.isArray(req.body.prospects) ? req.body.prospects : [];
  const results = [];

  for (const row of rows) {
    const payload = buildPlatformProspectPayload(row);
    const prospect = await PlatformOutreachProspect.findOneAndUpdate(
      buildProspectDuplicateQuery(payload),
      { $set: payload },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    results.push(prospect);
  }

  await recordPlatformOutreachEvent({
    event: {
      eventType: "prospects_imported",
      req,
      summary: `${results.length} platform outreach prospects imported.`,
      metadata: {
        importedCount: results.length,
        prospectIds: results.map((prospect) => String(prospect._id)),
      },
    },
  });

  res.status(200).json({ importedCount: results.length, prospects: results });
});

router.patch("/prospects/:id", async (req, res) => {
  const prospect = await PlatformOutreachProspect.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!prospect) return res.status(404).json({ message: "Prospect not found." });
  await recordPlatformOutreachEvent({
    event: {
      eventType: "prospect_updated",
      req,
      prospectId: prospect._id,
      summary: `Prospect updated: ${prospect.companyName}.`,
      metadata: {
        updatedFields: Object.keys(req.body || {}),
        status: prospect.status,
      },
    },
  });
  return res.status(200).json(prospect);
});

router.get("/campaigns", async (_req, res) => {
  const campaigns = await PlatformOutreachCampaign.find().sort({ updatedAt: -1 }).lean();
  res.status(200).json(campaigns);
});

router.post("/campaigns", async (req, res) => {
  const campaign = await PlatformOutreachCampaign.create({
    ...req.body,
    createdBy: req.platformAdmin?._id || null,
  });
  await recordPlatformOutreachEvent({
    event: {
      eventType: "campaign_created",
      req,
      campaignId: campaign._id,
      summary: `Campaign created: ${campaign.title}.`,
      metadata: {
        channels: campaign.channels,
        status: campaign.status,
      },
    },
  });
  res.status(201).json(campaign);
});

router.post("/campaigns/:id/generate", async (req, res) => {
  const [campaign, prospect] = await Promise.all([
    PlatformOutreachCampaign.findById(req.params.id).lean(),
    PlatformOutreachProspect.findById(req.body.prospectId).lean(),
  ]);
  if (!campaign) return res.status(404).json({ message: "Campaign not found." });
  if (!prospect) return res.status(404).json({ message: "Prospect not found." });

  let generated;
  try {
    generated = await generatePlatformOutreachWithLlm({
      campaign,
      prospect,
      channel: req.body.channel || "email",
      env: process.env,
    });
  } catch (error) {
    await recordPlatformOutreachEvent({
      event: {
        eventType: "message_generation_failed",
        req,
        prospectId: prospect._id,
        campaignId: campaign._id,
        actorType: "agent",
        summary: `Outreach draft generation failed for ${prospect.companyName}.`,
        metadata: {
          channel: req.body.channel || "email",
          error: error.message,
        },
      },
    });
    return res.status(400).json({ message: error.message });
  }

  const prompt = generated.prompt;

  if (!prompt) {
    return res.status(500).json({ message: "AI generation prompt was not returned." });
  }

  const message = await PlatformOutreachMessage.create({
    campaignId: campaign._id,
    prospectId: prospect._id,
    channel: req.body.channel || "email",
    direction: "outbound",
    subject: generated.subject,
    body: generated.body,
    status: "draft",
    llmGenerationMeta: {
      prompt,
      model: generated.model,
      confidence: generated.confidence,
      guardrailNotes: generated.guardrailNotes,
    },
  });

  await recordPlatformOutreachEvent({
    event: {
      eventType: "message_generated",
      req,
      prospectId: prospect._id,
      campaignId: campaign._id,
      messageId: message._id,
      actorType: "agent",
      summary: `Outreach draft generated for ${prospect.companyName}.`,
      metadata: {
        channel: message.channel,
        confidence: generated.confidence,
        guardrailNotes: generated.guardrailNotes,
      },
    },
  });

  return res.status(201).json({ message, prompt });
});

router.post("/campaigns/:id/launch", async (req, res) => {
  const campaign = await PlatformOutreachCampaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found." });
  const settings = await getSettings();
  const readiness = resolvePlatformOutreachReadiness({
    settings,
    channels: campaign.channels,
    env: process.env,
  });
  if (!readiness.ready) {
    await recordPlatformOutreachEvent({
      event: {
        eventType: "campaign_launch_blocked",
        req,
        campaignId: campaign._id,
        summary: `Campaign launch blocked: ${campaign.title}.`,
        metadata: {
          channels: campaign.channels,
          missing: readiness.missing || [],
        },
      },
    });
    return res.status(400).json({ message: "Provider readiness failed.", readiness });
  }
  campaign.status = "active";
  await campaign.save();
  await recordPlatformOutreachEvent({
    event: {
      eventType: "campaign_launched",
      req,
      campaignId: campaign._id,
      summary: `Campaign launched: ${campaign.title}.`,
      metadata: {
        channels: campaign.channels,
        readiness,
      },
    },
  });
  return res.status(200).json({ campaign, readiness });
});

router.post("/campaigns/:id/pause", async (req, res) => {
  const campaign = await PlatformOutreachCampaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found." });
  campaign.status = "paused";
  await campaign.save();
  await recordPlatformOutreachEvent({
    event: {
      eventType: "campaign_paused",
      req,
      campaignId: campaign._id,
      summary: `Campaign paused: ${campaign.title}.`,
      metadata: {
        reason: req.body?.reason || "",
      },
    },
  });
  return res.status(200).json({ campaign });
});

router.get("/messages", async (_req, res) => {
  const messages = await PlatformOutreachMessage.find().sort({ updatedAt: -1 }).limit(200).lean();
  res.status(200).json(messages);
});

const countByStatus = async (Model, statuses = []) => {
  const pairs = await Promise.all(
    statuses.map(async (status) => [status, await Model.countDocuments({ status })])
  );
  return Object.fromEntries(pairs);
};

router.get("/analytics", async (_req, res) => {
  const [
    prospectCount,
    qualifiedProspectCount,
    optedOutEmailCount,
    optedOutWhatsAppCount,
    campaignCount,
    activeCampaignCount,
    messageStatuses,
    threadStatuses,
    socialStatuses,
    recentFailures,
  ] = await Promise.all([
    PlatformOutreachProspect.countDocuments(),
    PlatformOutreachProspect.countDocuments({ status: "qualified" }),
    PlatformOutreachProspect.countDocuments({ emailOptOut: true }),
    PlatformOutreachProspect.countDocuments({ whatsappOptInStatus: "opted_out" }),
    PlatformOutreachCampaign.countDocuments(),
    PlatformOutreachCampaign.countDocuments({ status: "active" }),
    countByStatus(PlatformOutreachMessage, [
      "draft",
      "queued",
      "sent",
      "delivered",
      "failed",
      "replied",
      "opted_out",
      "escalated",
    ]),
    countByStatus(PlatformOutreachThread, ["open", "qualified", "needs_review", "closed", "opted_out"]),
    countByStatus(PlatformSocialPost, ["draft", "scheduled", "published", "failed"]),
    PlatformOutreachMessage.find({ status: "failed" })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("channel subject providerError updatedAt")
      .lean(),
  ]);

  return res.status(200).json({
    summary: {
      prospectCount,
      qualifiedProspectCount,
      optedOutProspectCount: optedOutEmailCount + optedOutWhatsAppCount,
      campaignCount,
      activeCampaignCount,
      sentMessageCount: messageStatuses.sent + messageStatuses.delivered,
      failedMessageCount: messageStatuses.failed,
      queuedMessageCount: messageStatuses.queued,
      activeThreadCount: threadStatuses.open + threadStatuses.needs_review + threadStatuses.qualified,
      socialPublishedCount: socialStatuses.published,
      socialFailedCount: socialStatuses.failed,
    },
    messages: messageStatuses,
    threads: threadStatuses,
    socialPosts: socialStatuses,
    recentFailures,
  });
});

router.post("/messages/:id/send-now", async (req, res) => {
  const message = await PlatformOutreachMessage.findById(req.params.id);
  if (!message) return res.status(404).json({ message: "Message not found." });
  message.status = "queued";
  message.scheduledFor = new Date();
  await message.save();
  await recordPlatformOutreachEvent({
    event: {
      eventType: "message_queued",
      req,
      prospectId: message.prospectId,
      campaignId: message.campaignId,
      messageId: message._id,
      summary: "Platform outreach message queued for immediate dispatch.",
      metadata: {
        channel: message.channel,
      },
    },
  });
  return res.status(200).json({ message });
});

router.get("/threads", async (_req, res) => {
  const threads = await PlatformOutreachThread.find()
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(200)
    .lean();
  return res.status(200).json(threads);
});

router.post("/threads/ingest-reply", async (req, res) => {
  const prospect = await PlatformOutreachProspect.findById(req.body.prospectId);
  if (!prospect) return res.status(404).json({ message: "Prospect not found." });

  const receivedAt = req.body.receivedAt ? new Date(req.body.receivedAt) : new Date();
  const inboundUpdate = buildInboundPlatformOutreachThreadUpdate({
    channel: req.body.channel || "email",
    subject: req.body.subject || "",
    body: req.body.body || "",
    providerMessageId: req.body.providerMessageId || "",
    receivedAt,
  });

  const participantAddress =
    req.body.participantAddress ||
    (req.body.channel === "whatsapp" ? prospect.whatsappNumber : prospect.email);

  const thread = await PlatformOutreachThread.findOneAndUpdate(
    {
      prospectId: prospect._id,
      channel: req.body.channel || "email",
      participantAddress,
    },
    {
      $set: {
        campaignId: req.body.campaignId || null,
        status: inboundUpdate.threadStatus,
        lastMessageAt: receivedAt,
      },
      $push: { messages: inboundUpdate.message },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  Object.assign(prospect, inboundUpdate.prospectUpdate);
  await prospect.save();

  await recordPlatformOutreachEvent({
    event: {
      eventType: inboundUpdate.threadStatus === "opted_out" ? "reply_opt_out_detected" : "reply_ingested",
      req,
      prospectId: prospect._id,
      campaignId: req.body.campaignId || null,
      actorType: "provider",
      summary: `Inbound ${req.body.channel || "email"} reply ingested for ${prospect.companyName}.`,
      metadata: {
        threadId: String(thread._id),
        status: inboundUpdate.threadStatus,
      },
    },
  });

  return res.status(201).json({ thread, prospect });
});

router.post("/threads/:id/agent-reply", async (req, res) => {
  const thread = await PlatformOutreachThread.findById(req.params.id);
  if (!thread) return res.status(404).json({ message: "Thread not found." });

  const [prospect, campaign] = await Promise.all([
    PlatformOutreachProspect.findById(thread.prospectId).lean(),
    thread.campaignId ? PlatformOutreachCampaign.findById(thread.campaignId).lean() : null,
  ]);
  const lastInbound = [...(thread.messages || [])].reverse().find((message) => message.direction === "inbound");
  const decision = buildPlatformAutoReplyDecision({
    body: req.body.body || lastInbound?.body || "",
    prospect: prospect || {},
    campaign: campaign || {},
  });

  thread.agentState = {
    ...(thread.agentState || {}),
    lastDecision: decision,
    decidedAt: new Date(),
  };
  thread.status = decision.requiresEscalation ? "needs_review" : thread.status;

  if (decision.action === "draft_auto_reply") {
    thread.messages.push({
      channel: thread.channel,
      direction: "outbound",
      subject: req.body.subject || "Re: Mazex platform",
      body: decision.replyBody,
      status: "draft",
      generatedAt: new Date(),
    });
    thread.lastMessageAt = new Date();
  }

  await thread.save();
  await recordPlatformOutreachEvent({
    event: {
      eventType: decision.requiresEscalation ? "agent_reply_escalated" : "agent_reply_drafted",
      req,
      prospectId: thread.prospectId,
      campaignId: thread.campaignId,
      actorType: "agent",
      summary: decision.requiresEscalation
        ? "Platform outreach reply escalated for human review."
        : "Platform outreach agent reply drafted for review.",
      metadata: {
        threadId: String(thread._id),
        decision,
      },
    },
  });

  return res.status(201).json({ thread, decision });
});

router.post("/threads/:id/approve-agent-reply", async (req, res) => {
  const thread = await PlatformOutreachThread.findById(req.params.id);
  if (!thread) return res.status(404).json({ message: "Thread not found." });

  const draftIndex = [...(thread.messages || [])]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => message.direction === "outbound" && message.status === "draft")?.index;

  if (draftIndex === undefined) {
    return res.status(400).json({ message: "No draft agent reply is available for approval." });
  }

  const draft = thread.messages[draftIndex] || {};
  if (!draft.body) {
    return res.status(400).json({ message: "Draft agent reply body is required before approval." });
  }

  const queuedMessage = await PlatformOutreachMessage.create({
    campaignId: thread.campaignId || null,
    prospectId: thread.prospectId,
    threadId: thread._id,
    channel: thread.channel,
    direction: "outbound",
    subject: req.body.subject || draft.subject || "Re: Mazex platform",
    body: draft.body,
    status: "queued",
    scheduledFor: new Date(),
  });

  thread.messages[draftIndex] = {
    ...draft,
    status: "queued",
    approvedAt: new Date(),
    queuedMessageId: String(queuedMessage._id),
  };
  thread.agentState = {
    ...(thread.agentState || {}),
    lastApprovedMessageId: String(queuedMessage._id),
    approvedAt: new Date(),
  };
  thread.lastMessageAt = new Date();
  thread.markModified("messages");
  thread.markModified("agentState");
  await thread.save();

  await recordPlatformOutreachEvent({
    event: {
      eventType: "agent_reply_queued",
      req,
      prospectId: thread.prospectId,
      campaignId: thread.campaignId,
      messageId: queuedMessage._id,
      actorType: "admin",
      summary: "Approved platform outreach agent reply queued for dispatch.",
      metadata: {
        threadId: String(thread._id),
        channel: thread.channel,
      },
    },
  });

  return res.status(201).json({ thread, message: queuedMessage });
});

router.get("/social-posts", async (_req, res) => {
  const posts = await PlatformSocialPost.find().sort({ scheduledFor: 1, updatedAt: -1 }).lean();
  res.status(200).json(posts);
});

router.post("/social-posts", async (req, res) => {
  const post = await PlatformSocialPost.create({
    ...req.body,
    createdBy: req.platformAdmin?._id || null,
  });
  await recordPlatformOutreachEvent({
    event: {
      eventType: "social_post_created",
      req,
      summary: `Platform social post created: ${post.title}.`,
      metadata: {
        socialPostId: String(post._id),
        platforms: post.platforms,
        status: post.status,
        scheduledFor: post.scheduledFor,
      },
    },
  });
  res.status(201).json(post);
});

router.patch("/social-posts/:id", async (req, res) => {
  const post = await PlatformSocialPost.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!post) return res.status(404).json({ message: "Social post not found." });
  await recordPlatformOutreachEvent({
    event: {
      eventType: "social_post_updated",
      req,
      summary: `Platform social post updated: ${post.title}.`,
      metadata: {
        socialPostId: String(post._id),
        updatedFields: Object.keys(req.body || {}),
        status: post.status,
      },
    },
  });
  return res.status(200).json(post);
});

router.post("/social-posts/:id/publish-now", async (req, res) => {
  const post = await PlatformSocialPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Social post not found." });
  post.status = "scheduled";
  post.scheduledFor = new Date();
  await post.save();
  await recordPlatformOutreachEvent({
    event: {
      eventType: "social_post_queued",
      req,
      summary: `Platform social post queued for publish: ${post.title}.`,
      metadata: {
        socialPostId: String(post._id),
        platforms: post.platforms,
      },
    },
  });
  return res.status(200).json({ post });
});

export default router;
