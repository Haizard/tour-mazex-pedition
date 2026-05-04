import process from "node:process";
import express from "express";
import Faq from "../models/Faq.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
  deleteAssistantKnowledgeEmbedding,
  syncAssistantKnowledgeEmbedding,
} from "../utils/pgvectorRetrieval.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const faqs = await Faq.find(buildTenantFilter(req)).sort({ createdAt: -1 });
    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", requireTenantAdmin, async (req, res) => {
  try {
    const faq = new Faq(withTenantId(req, req.body));
    await faq.save();
    await syncAssistantKnowledgeEmbedding(
      {
        sourceType: "faq-entry",
        sourceId: faq._id,
        tenantId: faq.tenantId,
        title: faq.question,
        body: faq.answer,
        metadata: {
          category: faq.category || "",
        },
      },
      process.env
    );
    res.status(201).json(faq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", requireTenantAdmin, async (req, res) => {
  try {
    const faq = await Faq.findOneAndDelete(buildTenantFilter(req, { _id: req.params.id }));
    if (faq) {
      await deleteAssistantKnowledgeEmbedding(
        {
          sourceType: "faq-entry",
          sourceId: faq._id,
        },
        process.env
      );
    }
    res.status(200).json({ message: "FAQ deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
