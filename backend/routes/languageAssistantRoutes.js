import express from "express";
import process from "node:process";
import LanguageAssistantProfile from "../models/LanguageAssistantProfile.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { summarizeLanguageAssistantProfile } from "../utils/languageAssistant.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
  deleteMongoDocumentFromShadowStore,
  syncMongoDocumentToShadowStore,
} from "../utils/postgresShadowWrites.js";
import {
  buildLanguageAssistantProfileView,
  deleteLanguageAssistantProfileRecord,
  findLanguageAssistantProfileRecord,
  syncLanguageAssistantProfileRecord,
} from "../utils/postgresAssistantRecords.js";
import { fetchPrimaryLanguageAssistantProfiles } from "../utils/postgresPrimaryReads.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("multi-language-ai-assistant"));

const syncLanguageAssistantViews = async (profile = {}) => {
  await syncMongoDocumentToShadowStore({
    entityType: "language-assistant-profiles",
    document: profile,
    model: LanguageAssistantProfile,
  });

  try {
    await syncLanguageAssistantProfileRecord(profile);
  } catch (error) {
    console.error("Language assistant profile sync failed:", error.message);
  }
};

router.get("/", async (req, res) => {
  try {
    if (req.query.source === "postgres") {
      return res.status(200).json(await fetchPrimaryLanguageAssistantProfiles(req.tenantId));
    }

    const profiles = await LanguageAssistantProfile.find(buildTenantFilter(req))
      .sort({ language: 1 })
      .lean();

    res.status(200).json(
      profiles.map((profile) => ({
        ...profile,
        profileSummary: summarizeLanguageAssistantProfile(profile),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const profile = new LanguageAssistantProfile(
      withTenantId(req, {
        language: req.body.language,
        localeCode: req.body.localeCode,
        tone: req.body.tone,
        useCases: Array.isArray(req.body.useCases) ? req.body.useCases : [],
        glossary: Array.isArray(req.body.glossary) ? req.body.glossary : [],
        status: req.body.status,
        notes: req.body.notes,
      })
    );

    await profile.save();
    await syncLanguageAssistantViews(profile.toObject());

    const profileView = await findLanguageAssistantProfileRecord(profile._id, req.tenantId, process.env);
    const responseProfile = profileView ? buildLanguageAssistantProfileView(profileView) : profile.toObject();

    res.status(201).json({
      ...responseProfile,
      profileSummary: summarizeLanguageAssistantProfile(responseProfile),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updates = {
      language: req.body.language,
      localeCode: req.body.localeCode,
      tone: req.body.tone,
      useCases: Array.isArray(req.body.useCases) ? req.body.useCases : undefined,
      glossary: Array.isArray(req.body.glossary) ? req.body.glossary : undefined,
      status: req.body.status,
      notes: req.body.notes,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const profile = await LanguageAssistantProfile.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true }
    ).lean();

    if (!profile) {
      return res.status(404).json({ message: "Language assistant profile not found" });
    }
    await syncLanguageAssistantViews(profile);

    const profileView = await findLanguageAssistantProfileRecord(profile._id, req.tenantId, process.env);
    const responseProfile = profileView ? buildLanguageAssistantProfileView(profileView) : profile;

    res.status(200).json({
      ...responseProfile,
      profileSummary: summarizeLanguageAssistantProfile(responseProfile),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const profile = await LanguageAssistantProfile.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!profile) {
      return res.status(404).json({ message: "Language assistant profile not found" });
    }

    await deleteLanguageAssistantProfileRecord(profile._id, profile.tenantId);
    await deleteMongoDocumentFromShadowStore({
      entityType: "language-assistant-profiles",
      sourceId: profile._id,
    });

    res.status(200).json({ message: "Language assistant profile deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
