import express from "express";
import {
  generatePageBuilderAiVariants,
  createTemplateStudioReusableSection,
  deleteTemplateStudioReusableSection,
  getPageConfig,
  getTemplateStudioBindingSuggestions,
  getTemplateStudioPage,
  importPageBuilderSource,
  importTemplateStudioSource,
  listTemplateStudioReusableSections,
  listPageConfigs,
  applyPageBuilderTemplate,
  resolvePageConfigBySlug,
  upsertTemplateStudioPage,
  upsertPageConfig,
} from "../controllers/pageConfigController.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/list/all", listPageConfigs);
router.get("/resolve/by-slug", resolvePageConfigBySlug);
router.get("/studio/reusable-sections", requireTenantAdmin, listTemplateStudioReusableSections);
router.post("/studio/reusable-sections", requireTenantAdmin, createTemplateStudioReusableSection);
router.delete("/studio/reusable-sections/:sectionId", requireTenantAdmin, deleteTemplateStudioReusableSection);
router.get("/studio/:pageType", requireTenantAdmin, getTemplateStudioPage);
router.put("/studio/:pageType", requireTenantAdmin, upsertTemplateStudioPage);
router.post("/studio/import", requireTenantAdmin, importTemplateStudioSource);
router.post("/studio/binding-suggestions", requireTenantAdmin, getTemplateStudioBindingSuggestions);
router.post("/templates/:templateId/apply", requireTenantAdmin, applyPageBuilderTemplate);
router.post("/import-source", requireTenantAdmin, importPageBuilderSource);
router.post("/:pageType/ai-variants", requireTenantAdmin, generatePageBuilderAiVariants);
router.get("/:pageType", getPageConfig);
router.put("/:pageType", requireTenantAdmin, upsertPageConfig);

export default router;
