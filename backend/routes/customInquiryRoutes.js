import express from 'express';
import CustomInquiry from '../models/CustomInquiry.js';
import QuoteProposal from '../models/QuoteProposal.js';
import SiteSettings from '../models/SiteSettings.js';
import TourPackage from '../models/TourPackage.js';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { buildTenantFilter, withTenantId } from '../utils/tenantContext.js';
import { generateInquiryLeadAutomation } from '../utils/leadAutomation.js';
import { scoreInquiryLead } from '../utils/leadScoring.js';
import { generateQuoteProposal } from '../utils/quoteProposal.js';

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
    firstTouchAt: body.firstTouchAt || new Date(),
    campaignLabel: body.campaignLabel || '',
    referralCode: body.referralCode || undefined,
});

// Get all inquiries (Admin)
router.get('/', requireTenantAdmin, async (req, res) => {
    try {
        const inquiries = await CustomInquiry.find(buildTenantFilter(req)).sort({ createdAt: -1 });
        const updates = [];

        const enrichedInquiries = inquiries.map((inquiry) => {
            const record = inquiry.toObject();
            const hasScoring =
                typeof record.leadScore === 'number' &&
                typeof record.leadTemperature === 'string' &&
                record.leadTemperature.length > 0;

            if (hasScoring) {
                return record;
            }

            const scoring = scoreInquiryLead(record);
            updates.push({
                updateOne: {
                    filter: { _id: inquiry._id, tenantId: req.tenantId },
                    update: { $set: scoring },
                }
            });

            return {
                ...record,
                ...scoring,
            };
        });

        if (updates.length > 0) {
            await CustomInquiry.bulkWrite(updates, { ordered: false });
        }

        enrichedInquiries.sort((left, right) => {
            const scoreDelta = (right.leadScore || 0) - (left.leadScore || 0);
            if (scoreDelta !== 0) {
                return scoreDelta;
            }
            return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        });

        res.status(200).json(enrichedInquiries);
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
        const scoring = scoreInquiryLead(inquiryData);

        if (inquiryData.referralCode) {
            scoring.leadScore = Math.min(100, (scoring.leadScore || 0) + 15);
            scoring.leadScoreReasons = scoring.leadScoreReasons || [];
            scoring.leadScoreReasons.push(`Referred traveler (Code: ${inquiryData.referralCode})`);
            scoring.leadTemperature = 'hot';
        }
        const newInquiry = new CustomInquiry(withTenantId(req, {
            ...inquiryData,
            ...scoring,
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
        const scoring = scoreInquiryLead(inquiryData);

        if (inquiryData.referralCode) {
            scoring.leadScore = Math.min(100, (scoring.leadScore || 0) + 15);
            scoring.leadScoreReasons = scoring.leadScoreReasons || [];
            scoring.leadScoreReasons.push(`Referred traveler (Code: ${inquiryData.referralCode})`);
            scoring.leadTemperature = 'hot';
        }
        const newInquiry = new CustomInquiry(withTenantId(req, {
            ...inquiryData,
            ...scoring,
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

// Public Quote Access (No Auth Required)
router.get('/public-quote/:token', async (req, res) => {
    try {
        const quote = await QuoteProposal.findOne({ publicToken: req.params.token })
            .populate('inquiryId', 'firstName lastName email destinations tripLengthDays adults status')
            .lean();

        if (!quote) {
            return res.status(404).json({ message: 'Quote not found or invalid link.' });
        }

        res.status(200).json(quote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Public Quote Response (Accept/Reject)
router.post('/public-quote/:token/respond', async (req, res) => {
    try {
        const { action, notes, reason } = req.body; // action: 'accept' | 'reject'
        
        const update = {
            status: action === 'accept' ? 'accepted' : 'rejected',
            conversionStage: action === 'accept' ? 'accepted' : 'rejected',
            travelerNotes: notes || '',
        };

        if (action === 'accept') {
            update.acceptedAt = new Date();
        }

        if (action === 'reject') {
            update.rejectionReason = reason || '';
        }

        const quote = await QuoteProposal.findOneAndUpdate(
            { publicToken: req.params.token },
            { $set: update },
            { new: true }
        ).lean();

        if (!quote) {
            return res.status(404).json({ message: 'Quote not found.' });
        }

        if (quote?.inquiryId) {
            await CustomInquiry.findByIdAndUpdate(quote.inquiryId, {
                $set: {
                    leadStage: action === 'accept' ? 'qualified' : 'follow-up',
                }
            });
        }

        res.status(200).json({
            message: `Quote successfully ${action === 'accept' ? 'accepted' : 'feedback received'}.`,
            quote
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update status (Admin)
router.patch('/:id', requireTenantAdmin, async (req, res) => {
    try {
        const nextFields = {};

        if (req.body.status) {
            nextFields.status = req.body.status;
        }

        if (req.body.leadStage) {
            nextFields.leadStage = req.body.leadStage;
        }

        if (Object.keys(nextFields).length === 0) {
            return res.status(400).json({ message: 'No inquiry updates were provided.' });
        }

        const updated = await CustomInquiry.findOneAndUpdate(
            buildTenantFilter(req, { _id: req.params.id }),
            nextFields,
            { new: true }
        );
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id/quotes', requireTenantAdmin, async (req, res) => {
    try {
        const quotes = await QuoteProposal.find(
            buildTenantFilter(req, { inquiryId: req.params.id })
        )
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(quotes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:id/generate-quote', requireTenantAdmin, async (req, res) => {
    try {
        const inquiry = await CustomInquiry.findOne(
            buildTenantFilter(req, { _id: req.params.id })
        ).lean();

        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found.' });
        }

        const tours = await TourPackage.find(buildTenantFilter(req)).lean();

        if (!tours.length) {
            return res.status(400).json({
                message: 'Create at least one tour package before generating quotes.'
            });
        }

        const proposal = generateQuoteProposal({
            inquiry,
            tours,
            tenantName: req.tenant?.name || 'Tour Operator',
            generatedBy: req.admin?.username || req.admin?._id?.toString() || '',
        });

        const quote = await QuoteProposal.create(
            withTenantId(req, {
                inquiryId: inquiry._id,
                ...proposal,
            })
        );

        res.status(201).json(quote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark Quote as Sent (Admin)
router.post('/:id/quotes/:quoteId/send', requireTenantAdmin, async (req, res) => {
    try {
        const quote = await QuoteProposal.findOneAndUpdate(
            buildTenantFilter(req, { _id: req.params.quoteId, inquiryId: req.params.id }),
            { $set: { status: 'sent', conversionStage: 'sent', sentAt: new Date() } },
            { new: true }
        ).lean();

        if (!quote) {
            return res.status(404).json({ message: 'Quote not found.' });
        }

        res.status(200).json({ message: 'Quote marked as sent to traveler.', quote });
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
