import express from "express";
import process from "node:process";
import TravelDocumentationGuide from "../models/TravelDocumentationGuide.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { summarizeTravelDocumentationGuide } from "../utils/travelDocumentationAssistant.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
  deleteMongoDocumentFromShadowStore,
  syncMongoDocumentToShadowStore,
} from "../utils/postgresShadowWrites.js";
import {
  buildTravelDocumentationGuideView,
  deleteTravelDocumentationGuideRecord,
  findTravelDocumentationGuideRecord,
  syncTravelDocumentationGuideRecord,
} from "../utils/postgresAssistantRecords.js";
import { fetchPrimaryTravelDocumentationGuides } from "../utils/postgresPrimaryReads.js";
import {
  deleteAssistantKnowledgeEmbedding,
  buildAssistantKnowledgeRecord,
  syncAssistantKnowledgeEmbedding,
} from "../utils/pgvectorRetrieval.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("travel-documentation-assistant"));

const syncTravelDocumentationViews = async (guide = {}) => {
  await syncMongoDocumentToShadowStore({
    entityType: "travel-documentation-guides",
    document: guide,
    model: TravelDocumentationGuide,
  });

  try {
    await syncTravelDocumentationGuideRecord(guide);
  } catch (error) {
    console.error("Travel documentation guide sync failed:", error.message);
  }

  try {
    await syncAssistantKnowledgeEmbedding(
      buildAssistantKnowledgeRecord({
        sourceType: "travel-documentation-guide",
        sourceId: guide._id,
        tenantId: guide.tenantId,
        title: `${guide.market || "Traveler market"} ${guide.topic || "guide"}`.trim(),
        body: [
          guide.requirementSummary,
          guide.sourceLabel,
          guide.notes,
        ]
          .filter(Boolean)
          .join(" "),
        metadata: {
          market: guide.market || "",
          topic: guide.topic || "",
          status: guide.status || "",
        },
      }),
      process.env
    );
  } catch (error) {
    console.error("Travel documentation embedding sync failed:", error.message);
  }
};

router.get("/", async (req, res) => {
  try {
    if (req.query.source === "postgres") {
      return res.status(200).json(await fetchPrimaryTravelDocumentationGuides(req.tenantId));
    }

    const guides = await TravelDocumentationGuide.find(buildTenantFilter(req))
      .sort({ market: 1, topic: 1 })
      .lean();

    res.status(200).json(
      guides.map((guide) => ({
        ...guide,
        guideSummary: summarizeTravelDocumentationGuide(guide),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const guide = new TravelDocumentationGuide(
      withTenantId(req, {
        market: req.body.market,
        topic: req.body.topic,
        requirementSummary: req.body.requirementSummary,
        sourceLabel: req.body.sourceLabel,
        lastReviewedAt: req.body.lastReviewedAt || null,
        status: req.body.status,
        notes: req.body.notes,
      })
    );

    await guide.save();
    await syncTravelDocumentationViews(guide.toObject());

    const guideView = await findTravelDocumentationGuideRecord(guide._id, req.tenantId, process.env);
    const responseGuide = guideView ? buildTravelDocumentationGuideView(guideView) : guide.toObject();

    res.status(201).json({
      ...responseGuide,
      guideSummary: summarizeTravelDocumentationGuide(responseGuide),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updates = {
      market: req.body.market,
      topic: req.body.topic,
      requirementSummary: req.body.requirementSummary,
      sourceLabel: req.body.sourceLabel,
      lastReviewedAt: Object.prototype.hasOwnProperty.call(req.body, "lastReviewedAt")
        ? req.body.lastReviewedAt || null
        : undefined,
      status: req.body.status,
      notes: req.body.notes,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const guide = await TravelDocumentationGuide.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true }
    ).lean();

    if (!guide) {
      return res.status(404).json({ message: "Travel documentation guide not found" });
    }
    await syncTravelDocumentationViews(guide);

    const guideView = await findTravelDocumentationGuideRecord(guide._id, req.tenantId, process.env);
    const responseGuide = guideView ? buildTravelDocumentationGuideView(guideView) : guide;

    res.status(200).json({
      ...responseGuide,
      guideSummary: summarizeTravelDocumentationGuide(responseGuide),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const guide = await TravelDocumentationGuide.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!guide) {
      return res.status(404).json({ message: "Travel documentation guide not found" });
    }

    await deleteTravelDocumentationGuideRecord(guide._id, guide.tenantId);
    await deleteAssistantKnowledgeEmbedding(
      {
        sourceType: "travel-documentation-guide",
        sourceId: guide._id,
      },
      process.env
    );
    await deleteMongoDocumentFromShadowStore({
      entityType: "travel-documentation-guides",
      sourceId: guide._id,
    });

    res.status(200).json({ message: "Travel documentation guide deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
