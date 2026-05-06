import express from "express";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import MarketplacePartnership from "../models/MarketplacePartnership.js";
import TourPackage from "../models/TourPackage.js";
import TourismLeadCandidate from "../models/TourismLeadCandidate.js";

import { createPostgresFirstPartnership } from "../utils/postgresFirstPartnershipService.js";
import { analyzeTourismLeadSource } from "../utils/tourismLeadDiscovery.js";

const router = express.Router();

// Public Discovery (requires API Key or Tenant Context - simplified here for Admin first)
router.use(requireTenantAdmin);

router.post("/lead-discovery/analyze", async (req, res) => {
  try {
    const {
      sourceUrl,
      officialWebsiteUrl = "",
      pageText = "",
      organizationName = "",
      categories = [],
      operatorNotes = "",
    } = req.body || {};

    if (!sourceUrl || !pageText) {
      return res.status(400).json({ message: "sourceUrl and pageText are required for compliant analysis." });
    }

    const analysis = analyzeTourismLeadSource({
      sourceUrl,
      officialWebsiteUrl,
      pageText,
      organizationName,
      categories,
    });

    const candidate = await TourismLeadCandidate.findOneAndUpdate(
      {
        tenantId: req.tenantId,
        sourceUrl,
      },
      {
        $set: {
          tenantId: req.tenantId,
          organizationName,
          sourceUrl,
          officialWebsiteUrl,
          sourcePolicy: analysis.sourcePolicy,
          allowedContacts: analysis.allowedContacts,
          blockedContacts: analysis.blockedContacts,
          categories,
          complianceFlags: analysis.complianceFlags,
          leadScore: analysis.leadScore,
          leadTemperature: analysis.leadTemperature,
          leadScoreReasons: analysis.leadScoreReasons,
          recommendedUseCases: analysis.recommendedUseCases,
          outreachAllowed: analysis.outreachAllowed,
          sourceExcerpt: pageText.slice(0, 1200),
          operatorNotes,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return res.status(201).json({ candidate });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/lead-discovery/candidates", async (req, res) => {
  try {
    const { status, temperature } = req.query;
    const query = { tenantId: req.tenantId };

    if (status) {
      query.outreachStatus = status;
    }

    if (temperature) {
      query.leadTemperature = temperature;
    }

    const candidates = await TourismLeadCandidate.find(query)
      .sort({ leadScore: -1, updatedAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({ candidates });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/marketplace/tours
 * Fetch tours from the network that are open for partnership.
 * [SKILL: Aggregation Logic]
 */
router.get("/tours", async (req, res) => {
  try {
    // 1. Find tours from OTHER tenants that are marked as marketplace visible
    // and aren't already in a partnership with the current tenant.
    const tours = await TourPackage.find({
      tenantId: { $ne: req.tenantId },
      isMarketplaceVisible: true
    }).populate("tenantId", "name slug").lean();

    res.status(200).json(tours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/marketplace/partnerships/request
 */
router.post("/partnerships/request", async (req, res) => {
  const { providerTenantId } = req.body;

  try {
    const partnership = await createPostgresFirstPartnership({
      providerTenantId,
      distributorTenantId: String(req.tenantId || ""),
      status: "requested"
    }, globalThis.process?.env || {});

    res.status(201).json(partnership);
  } catch (error) {
    console.error("Partnership Request Error:", error.message);
    res.status(500).json({ message: "Partnership request failed. You might already have a request with this provider." });
  }
});

/**
 * GET /api/marketplace/partnerships/my-inventory
 * Tours I am providing to the marketplace.
 */
router.get("/partnerships/my-inventory", async (req, res) => {
  try {
    const partnerships = await MarketplacePartnership.find({
      providerTenantId: req.tenantId,
      status: "active"
    }).lean();
    res.status(200).json(partnerships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/marketplace/partnerships/external-inventory
 * Tours I am selling from other operators.
 */
router.get("/partnerships/external-inventory", async (req, res) => {
  try {
    const partnerships = await MarketplacePartnership.find({
      distributorTenantId: req.tenantId,
      status: "active"
    }).populate("providerTenantId").lean();
    
    res.status(200).json(partnerships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
