import express from 'express';
import HomeContent from '../models/HomeContent.js';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { buildTenantFilter, withTenantId } from '../utils/tenantContext.js';
import { syncAssistantKnowledgeEmbedding } from "../utils/pgvectorRetrieval.js";

const router = express.Router();

const syncHomeContentKnowledgeEmbedding = async (content = {}) => {
    await syncAssistantKnowledgeEmbedding({
        sourceType: "home-content-section",
        sourceId: content._id,
        tenantId: content.tenantId,
        title: content.title || content.section || "Home content",
        body: [
            content.section,
            content.subtitle,
            content.description,
            content.quote,
            content.quoteAuthor,
        ]
            .filter(Boolean)
            .join(" "),
        metadata: {
            section: content.section || "",
        },
    });
};

// Get content for all sections
router.get('/', async (req, res) => {
    try {
        const content = await HomeContent.find(buildTenantFilter(req));
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update or create section content
router.post('/', requireTenantAdmin, async (req, res) => {
    const { section, title, subtitle, description, quote, quoteAuthor } = req.body;
    try {
        const updated = await HomeContent.findOneAndUpdate(
            buildTenantFilter(req, { section }),
            withTenantId(req, { title, subtitle, description, quote, quoteAuthor }),
            { upsert: true, new: true }
        );
        await syncHomeContentKnowledgeEmbedding(updated.toObject ? updated.toObject() : updated);
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
