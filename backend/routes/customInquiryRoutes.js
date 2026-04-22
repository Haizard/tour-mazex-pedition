import express from 'express';
import CustomInquiry from '../models/CustomInquiry.js';
import SiteSettings from '../models/SiteSettings.js';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { buildTenantFilter, withTenantId } from '../utils/tenantContext.js';
import { generateInquiryLeadAutomation } from '../utils/leadAutomation.js';

const router = express.Router();

const getTenantWhatsAppNumber = async (req) => {
    const settings = await SiteSettings.findOne(buildTenantFilter(req)).select('whatsapp');
    return settings?.whatsapp || '';
};

const buildInquiryPayload = (body = {}, sourceChannel = 'website') => ({
    ...body,
    name: body.name || `${body.firstName || ""} ${body.lastName || ""}`.trim(),
    tripLengthDays: Number(body.tripLengthDays),
    adults: Number(body.adults),
    childrenUnder5: Number(body.childrenUnder5 || 0),
    children6To15: Number(body.children6To15 || 0),
    duration: body.duration || (body.tripLengthDays ? `${body.tripLengthDays} days` : undefined),
    sourceChannel,
});

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
    try {
        const inquiryData = buildInquiryPayload(req.body, req.body.sourceChannel || 'website');
        const whatsappNumber = await getTenantWhatsAppNumber(req);
        const automation = generateInquiryLeadAutomation(inquiryData, {
            tenantName: req.tenant?.name || 'MAZ Expeditions',
            whatsappNumber,
        });
        const newInquiry = new CustomInquiry(withTenantId(req, {
            ...inquiryData,
            automationSummary: automation.summary,
            followUpMessage: automation.followUpMessage,
        }));
        await newInquiry.save();
        res.status(201).json({
            inquiry: newInquiry,
            automation,
        });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

router.post('/whatsapp-lead', async (req, res) => {
    try {
        const fullName = req.body.name?.toString().trim() || '';
        const [firstName = '', ...remainingNames] = fullName.split(' ');
        const lastName = remainingNames.join(' ').trim() || 'Lead';
        const destinations = req.body.destination ? [req.body.destination] : ['Tanzania Safari'];
        const inquiryData = buildInquiryPayload({
            firstName,
            lastName,
            name: fullName || 'WhatsApp Lead',
            email: req.body.email || `${(firstName || 'lead').toLowerCase()}@placeholder.local`,
            phone: req.body.phone || 'Not provided',
            destinations,
            tripLengthDays: req.body.tripLengthDays || 5,
            adults: req.body.adults || 2,
            childrenUnder5: 0,
            children6To15: 0,
            travelWhen: req.body.travelWhen || 'Flexible',
            sleepingArrangement: req.body.sleepingArrangement || 'Flexible',
            accommodationPreferences: req.body.accommodationPreferences?.length ? req.body.accommodationPreferences : ['Flexible'],
            contactPreference: 'whatsapp',
            budget: req.body.budget || '',
            message: req.body.message || `Interested in ${destinations[0]} and would like pricing plus itinerary ideas.`,
        }, 'whatsapp-button');

        const whatsappNumber = await getTenantWhatsAppNumber(req);
        const automation = generateInquiryLeadAutomation(inquiryData, {
            tenantName: req.tenant?.name || 'MAZ Expeditions',
            whatsappNumber,
        });
        const newInquiry = new CustomInquiry(withTenantId(req, {
            ...inquiryData,
            automationSummary: automation.summary,
            followUpMessage: automation.followUpMessage,
        }));

        await newInquiry.save();

        res.status(201).json({
            inquiry: newInquiry,
            automation,
        });
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
