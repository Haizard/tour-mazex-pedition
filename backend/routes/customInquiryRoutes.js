import express from 'express';
import CustomInquiry from '../models/CustomInquiry.js';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { buildTenantFilter, withTenantId } from '../utils/tenantContext.js';

const router = express.Router();

// Get all inquiries (Admin)
router.get('/', requireTenantAdmin, async (req, res) => {
    try {
        const inquiries = await CustomInquiry.find(buildTenantFilter(req)).sort({ createdAt: -1 });
        res.status(200).json(inquiries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new inquiry (Customer)
router.post('/', async (req, res) => {
    const inquiryData = {
        ...req.body,
        name: req.body.name || `${req.body.firstName || ""} ${req.body.lastName || ""}`.trim(),
        tripLengthDays: Number(req.body.tripLengthDays),
        adults: Number(req.body.adults),
        childrenUnder5: Number(req.body.childrenUnder5 || 0),
        children6To15: Number(req.body.children6To15 || 0),
        duration: req.body.duration || (req.body.tripLengthDays ? `${req.body.tripLengthDays} days` : undefined),
    };
    const newInquiry = new CustomInquiry(withTenantId(req, inquiryData));
    try {
        await newInquiry.save();
        res.status(201).json(newInquiry);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

// Update status (Admin)
router.patch('/:id', requireTenantAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await CustomInquiry.findOneAndUpdate(
            buildTenantFilter(req, { _id: req.params.id }),
            { status },
            { new: true }
        );
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete (Admin)
router.delete('/:id', requireTenantAdmin, async (req, res) => {
    try {
        await CustomInquiry.findOneAndDelete(buildTenantFilter(req, { _id: req.params.id }));
        res.status(200).json({ message: 'Inquiry deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
