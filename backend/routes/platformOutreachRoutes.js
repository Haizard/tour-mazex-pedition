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
import { resolvePlatformOutreachReadiness } from "../utils/platformOutreachProviders.js";

const router = express.Router();

router.use(requirePlatformAdmin);

const getSettings = async () =>
  PlatformOutreachSettings.findOneAndUpdate(
    { singletonKey: "platform-outreach" },
    { $setOnInsert: { singletonKey: "platform-outreach" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

router.get("/settings/readiness", async (_req, res) => {
  const settings = await getSettings();
  res.status(200).json({
    readiness: resolvePlatformOutreachReadiness({
      settings,
      channels: ["email", "whatsapp", "facebook", "instagram"],
      env: process.env,
    }),
    settings,
  });
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

  res.status(200).json({ importedCount: results.length, prospects: results });
});

router.patch("/prospects/:id", async (req, res) => {
  const prospect = await PlatformOutreachProspect.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!prospect) return res.status(404).json({ message: "Prospect not found." });
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
    return res.status(400).json({ message: "Provider readiness failed.", readiness });
  }
  campaign.status = "active";
  await campaign.save();
  return res.status(200).json({ campaign, readiness });
});

router.get("/messages", async (_req, res) => {
  const messages = await PlatformOutreachMessage.find().sort({ updatedAt: -1 }).limit(200).lean();
  res.status(200).json(messages);
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
  res.status(201).json(post);
});

router.patch("/social-posts/:id", async (req, res) => {
  const post = await PlatformSocialPost.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!post) return res.status(404).json({ message: "Social post not found." });
  return res.status(200).json(post);
});

export default router;
