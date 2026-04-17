import express from 'express';
import HomeContent from '../models/HomeContent.js';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { buildTenantFilter, withTenantId } from '../utils/tenantContext.js';

const router = express.Router();

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
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
