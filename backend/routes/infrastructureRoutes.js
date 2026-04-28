import express from "express";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { buildInfrastructureReadinessReport } from "../utils/infrastructureHealth.js";
import {
  buildBusinessTruthCutoverPlan,
  listBusinessTruthEntities,
  summarizeInfrastructureTargets,
} from "../utils/businessTruthRegistry.js";

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

export default router;
