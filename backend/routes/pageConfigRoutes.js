import express from "express";
import {
  getPageConfig,
  listPageConfigs,
  resolvePageConfigBySlug,
  upsertPageConfig,
} from "../controllers/pageConfigController.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/list/all", listPageConfigs);
router.get("/resolve/by-slug", resolvePageConfigBySlug);
router.get("/:pageType", getPageConfig);
router.put("/:pageType", requireTenantAdmin, upsertPageConfig);

export default router;
