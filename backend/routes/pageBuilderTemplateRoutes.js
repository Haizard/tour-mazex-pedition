import express from "express";
import PageBuilderTemplate from "../models/PageBuilderTemplate.js";
import { getTemplateCatalog, resolveTemplateCatalogForTenant } from "../../src/pageBuilder/templateMarketplace.js";
import { mergeTemplateCatalog, serializePlatformTemplate } from "../utils/platformTemplateRegistry.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const platformTemplates = await PageBuilderTemplate.find({ status: "published" })
      .sort({ releaseOrder: -1, createdAt: -1 })
      .lean();
    const serializedTemplates = platformTemplates.map(serializePlatformTemplate);
    const templates = req.isPlatform
      ? mergeTemplateCatalog(getTemplateCatalog(), serializedTemplates)
      : resolveTemplateCatalogForTenant(req.tenant || {}, serializedTemplates);

    res.status(200).json({ templates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
