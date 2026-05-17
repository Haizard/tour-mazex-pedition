import express from "express";
import {
  generatePageBuilderAiVariants,
  getPageConfig,
  importPageBuilderSource,
  listPageConfigs,
  applyPageBuilderTemplate,
  resolvePageConfigBySlug,
  upsertPageConfig,
} from "../controllers/pageConfigController.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/list/all", listPageConfigs);
router.get("/resolve/by-slug", resolvePageConfigBySlug);
router.post("/templates/:templateId/apply", requireTenantAdmin, applyPageBuilderTemplate);
router.post("/import-source", requireTenantAdmin, importPageBuilderSource);
router.post("/:pageType/ai-variants", requireTenantAdmin, generatePageBuilderAiVariants);
router.get("/:pageType", getPageConfig);
router.put("/:pageType", requireTenantAdmin, upsertPageConfig);

export default router;
