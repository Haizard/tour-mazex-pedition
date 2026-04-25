import express from "express";

import CompetitorInsight from "../models/CompetitorInsight.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { summarizeCompetitorInsight } from "../utils/competitorIntelligence.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("competitor-intelligence"));

router.get("/", async (req, res) => {
  try {
    const insights = await CompetitorInsight.find(buildTenantFilter(req))
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json(
      insights.map((insight) => ({
        ...insight,
        intelligenceSummary: summarizeCompetitorInsight(insight),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const insight = new CompetitorInsight(
      withTenantId(req, {
        competitorName: req.body.competitorName,
        marketRegion: req.body.marketRegion,
        focusRoute: req.body.focusRoute,
        observedPriceUsd: req.body.observedPriceUsd,
        currency: req.body.currency,
        marketTrend: req.body.marketTrend,
        offerSummary: req.body.offerSummary,
        sourceLabel: req.body.sourceLabel,
        intelligenceDate: req.body.intelligenceDate,
        strengthSignals: req.body.strengthSignals,
        riskSignals: req.body.riskSignals,
        status: req.body.status,
        notes: req.body.notes,
      })
    );

    await insight.save();

    const result = insight.toObject();
    res.status(201).json({
      ...result,
      intelligenceSummary: summarizeCompetitorInsight(result),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updates = {
      competitorName: req.body.competitorName,
      marketRegion: req.body.marketRegion,
      focusRoute: req.body.focusRoute,
      observedPriceUsd: req.body.observedPriceUsd,
      currency: req.body.currency,
      marketTrend: req.body.marketTrend,
      offerSummary: req.body.offerSummary,
      sourceLabel: req.body.sourceLabel,
      intelligenceDate: req.body.intelligenceDate,
      strengthSignals: req.body.strengthSignals,
      riskSignals: req.body.riskSignals,
      status: req.body.status,
      notes: req.body.notes,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const insight = await CompetitorInsight.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true }
    ).lean();

    if (!insight) {
      return res.status(404).json({ message: "Competitor insight not found" });
    }

    res.status(200).json({
      ...insight,
      intelligenceSummary: summarizeCompetitorInsight(insight),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const insight = await CompetitorInsight.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!insight) {
      return res.status(404).json({ message: "Competitor insight not found" });
    }

    res.status(200).json({ message: "Competitor insight deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
