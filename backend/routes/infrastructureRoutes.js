import express from "express";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { buildInfrastructureReadinessReport } from "../utils/infrastructureHealth.js";
import {
  buildBusinessTruthCutoverPlan,
  listBusinessTruthEntities,
  summarizeInfrastructureTargets,
} from "../utils/businessTruthRegistry.js";
import { fetchRevenueRecordReadModel } from "../utils/postgresRevenueReadModel.js";
import { fetchTravelerInquiryReadModel } from "../utils/postgresTravelerReadModel.js";

const router = express.Router();

router.use(requireTenantAdmin);

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

export default router;
