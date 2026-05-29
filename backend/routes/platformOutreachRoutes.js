import express from "express";
import PlatformOutreachCampaign from "../models/PlatformOutreachCampaign.js";
import PlatformOutreachMessage from "../models/PlatformOutreachMessage.js";
import PlatformOutreachProspect from "../models/PlatformOutreachProspect.js";
import PlatformOutreachSettings from "../models/PlatformOutreachSettings.js";
import PlatformSocialPost from "../models/PlatformSocialPost.js";
import { requirePlatformAdmin } from "../middleware/platformAdminAuthMiddleware.js";
import {
  buildPlatformProspectPayload,
  buildProspectDuplicateQuery,
} from "../utils/platformOutreachProspects.js";
import {
  buildPlatformOutreachPrompt,
  validateGeneratedOutreach,
} from "../utils/platformOutreachGeneration.js";
import { recordPlatformOutreachEvent } from "../utils/platformOutreachEventLog.js";
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

  const prompt = buildPlatformOutreachPrompt({
    campaign,
    prospect,
    channel: req.body.channel || "email",
  });
  const generated = validateGeneratedOutreach({
    subject: `${campaign.title} for ${prospect.companyName}`,
    body: `Hello ${prospect.companyName}, Mazex helps tour companies modernize websites, AI lead capture, social content, and follow-up workflows. Reply if you want a short demo.`,
    confidence: 0.7,
    guardrailNotes: ["deterministic-initial-draft"],
  });

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
