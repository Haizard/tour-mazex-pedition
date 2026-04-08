import express from 'express';
import HomeContent from '../models/HomeContent.js';

const router = express.Router();

// Get content for all sections
router.get('/', async (req, res) => {
    try {
        const content = await HomeContent.find();
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update or create section content
router.post('/', async (req, res) => {
    const { section, title, subtitle, description, quote, quoteAuthor } = req.body;
    try {
        const updated = await HomeContent.findOneAndUpdate(
            { section },
            { title, subtitle, description, quote, quoteAuthor },
            { upsert: true, new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
