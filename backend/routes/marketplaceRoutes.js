import express from "express";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import MarketplacePartnership from "../models/MarketplacePartnership.js";
import TourPackage from "../models/TourPackage.js";
import Tenant from "../models/Tenant.js";

import { createPostgresFirstPartnership } from "../utils/postgresFirstPartnershipService.js";

const router = express.Router();

// Public Discovery (requires API Key or Tenant Context - simplified here for Admin first)
router.use(requireTenantAdmin);

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
    }, process.env);

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
