import express from "express";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { buildInfrastructureReadinessReport } from "../utils/infrastructureHealth.js";
import {
  buildBusinessTruthCutoverPlan,
  listBusinessTruthEntities,
  summarizeInfrastructureTargets,
} from "../utils/businessTruthRegistry.js";
import { fetchAssistantReadModel } from "../utils/postgresAssistantReadModel.js";
import { fetchCompetitorReadModel } from "../utils/postgresCompetitorReadModel.js";
import { fetchEngagementReadModel } from "../utils/postgresEngagementReadModel.js";
import { fetchMediaReadModel } from "../utils/postgresMediaReadModel.js";
import { fetchOperationsReadModel } from "../utils/postgresOperationsReadModel.js";
import { fetchPartnerReadModel } from "../utils/postgresPartnerReadModel.js";
import { fetchRevenueRecordReadModel } from "../utils/postgresRevenueReadModel.js";
import { fetchTravelerInquiryReadModel } from "../utils/postgresTravelerReadModel.js";
import { buildEcosystemIntelligenceReport } from "../utils/ecosystemIntelligence.js";
import { buildDemandForecastReport } from "../utils/demandForecasting.js";
import { scoreTrustSignals } from "../utils/trustScoring.js";

const router = express.Router();

router.use(requireTenantAdmin);

router.get("/intelligence", async (req, res) => {
  try {
    const report = await buildEcosystemIntelligenceReport(req.tenantId);
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Demand Forecasting ────────────────────────────────────────────────────────
router.get("/demand-forecast", async (req, res) => {
  try {
    const report = await buildDemandForecastReport(
      String(req.tenantId || ""),
      process.env
    );
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Trust Signal Catalogue ────────────────────────────────────────────────────
// Returns the trust signal definitions and a sample score for admin visibility
router.get("/trust-report", (req, res) => {
  try {
    // Return signal catalogue — live scoring happens at booking creation time
    const sampleScore = scoreTrustSignals({
      email: "test@gmail.com",
      phone: "+255700000001",
      adults: 2,
      budget: "2000",
      travelWhen: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      name: "Sample Traveler",
    });

    res.status(200).json({
      description: "Trust & Fraud Scoring Layer — Milestone 5 Network Intelligence",
      signals: [
        { key: "disposable_email_domain", weight: -40, description: "Email domain is on disposable email blocklist" },
        { key: "missing_name", weight: -15, description: "Name is missing or too short" },
        { key: "suspicious_single_char_name", weight: -20, description: "Name appears to be a single character placeholder" },
        { key: "invalid_phone_length", weight: -20, description: "Phone number has fewer than 7 digits" },
        { key: "repeated_digit_phone", weight: -25, description: "Phone number is all the same repeated digit" },
        { key: "budget_group_size_mismatch", weight: -20, description: "Budget is extremely low relative to group size" },
        { key: "travel_date_in_past", weight: -30, description: "Travel date is in the past" },
        { key: "travel_date_less_than_24h", weight: -15, description: "Travel date is less than 24 hours away" },
        { key: "velocity_risk_N_bookings_24h", weight: -35, description: "Same email made multiple bookings within 24 hours" },
      ],
      sampleScore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/business-truth", (_req, res) => {
  res.status(200).json({
    entities: listBusinessTruthEntities(),
    cutoverPlan: buildBusinessTruthCutoverPlan(),
    infrastructureTargets: summarizeInfrastructureTargets(),
  });
});

router.get("/health", async (_req, res) => {
  try {
    const report = await buildInfrastructureReadinessReport();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/revenue-records", async (req, res) => {
  try {
    const report = await fetchRevenueRecordReadModel({
      tenantId: String(req.tenantId || ""),
      limit: Number(req.query.limit || 12),
    });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/traveler-records", async (req, res) => {
  try {
    const report = await fetchTravelerInquiryReadModel({
      tenantId: String(req.tenantId || ""),
      limit: Number(req.query.limit || 12),
    });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/operations-records", async (req, res) => {
  try {
    const report = await fetchOperationsReadModel({
      tenantId: String(req.tenantId || ""),
      limit: Number(req.query.limit || 12),
    });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/partner-records", async (req, res) => {
  try {
    const report = await fetchPartnerReadModel({
      tenantId: String(req.tenantId || ""),
      limit: Number(req.query.limit || 12),
    });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/media-records", async (req, res) => {
  try {
    const report = await fetchMediaReadModel({
      tenantId: String(req.tenantId || ""),
      limit: Number(req.query.limit || 12),
    });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/competitor-records", async (req, res) => {
  try {
    const report = await fetchCompetitorReadModel({
      tenantId: String(req.tenantId || ""),
      limit: Number(req.query.limit || 12),
    });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/assistant-records", async (req, res) => {
  try {
    const report = await fetchAssistantReadModel({
      tenantId: String(req.tenantId || ""),
      limit: Number(req.query.limit || 12),
    });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/engagement-records", async (req, res) => {
  try {
    const report = await fetchEngagementReadModel({
      tenantId: String(req.tenantId || ""),
      limit: Number(req.query.limit || 12),
    });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
