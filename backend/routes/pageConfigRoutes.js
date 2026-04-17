import express from "express";
import { getPageConfig, upsertPageConfig } from "../controllers/pageConfigController.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/:pageType", getPageConfig);
router.put("/:pageType", requireTenantAdmin, upsertPageConfig);

export default router;
