import express from 'express';
import Visionary from '../models/Visionary.js';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { buildTenantFilter, withTenantId } from '../utils/tenantContext.js';

const router = express.Router();

// GET all visionaries
router.get('/', async (req, res) => {
    try {
        const visionaries = await Visionary.find(buildTenantFilter(req)).sort({ createdAt: -1 });
        res.json(visionaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET a single visionary
router.get('/:id', async (req, res) => {
    try {
        const visionary = await Visionary.findOne(buildTenantFilter(req, { _id: req.params.id }));
        res.json(visionary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', requireTenantAdmin, async (req, res) => {
    const visionary = new Visionary(withTenantId(req, {
        name: req.body.name,
        duty: req.body.duty,
        image: req.body.image
    }));

    try {
        const newVisionary = await visionary.save();
        res.status(201).json(newVisionary);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT to update a visionary
router.put('/:id', requireTenantAdmin, async (req, res) => {
    try {
        const updatedVisionary = await Visionary.findOneAndUpdate(
            buildTenantFilter(req, { _id: req.params.id }),
            req.body,
            { new: true }
        );
        res.json(updatedVisionary);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE a visionary
router.delete('/:id', requireTenantAdmin, async (req, res) => {
    try {
        await Visionary.findOneAndDelete(buildTenantFilter(req, { _id: req.params.id }));
        res.json({ message: 'Visionary deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
