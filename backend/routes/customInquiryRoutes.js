import express from 'express';
import process from "node:process";
import CustomInquiry from '../models/CustomInquiry.js';
import QuoteProposal from '../models/QuoteProposal.js';
import SiteSettings from '../models/SiteSettings.js';
import SocialAccount from "../models/SocialAccount.js";
import Tenant from "../models/Tenant.js";
import TourPackage from '../models/TourPackage.js';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { buildTenantFilter, withTenantId } from '../utils/tenantContext.js';
import {
    enhanceHotelInquiryAutomation,
    generateInquiryLeadAutomation,
} from '../utils/leadAutomation.js';
import { enhanceRestaurantInquiryAutomation } from '../utils/restaurantLeadAutopilot.js';
import { scoreInquiryLead } from '../utils/leadScoring.js';
import { generateQuoteProposal } from '../utils/quoteProposal.js';
import {
    deleteMongoDocumentFromShadowStore,
    syncMongoDocumentToShadowStore,
} from '../utils/postgresShadowWrites.js';
import { fetchPrimaryInquiries, fetchPrimaryInquiryQuotes } from '../utils/postgresPrimaryReads.js';
import LeadFollowUpSequence from "../models/LeadFollowUpSequence.js";
import {
    deleteLeadFollowUpSequenceRecord,
} from "../utils/postgresEngagementRecords.js";
import {
    buildTravelerInquiryView,
    deleteTravelerInquiryRecord,
    findTravelerInquiryRecord,
} from '../utils/postgresTravelerInquiryRecords.js';
import { preferPrimaryCollection } from "../utils/postgresReadFallback.js";
import { safePrimaryLookup } from "../utils/safePrimaryLookup.js";
import {
    buildQuoteRevenueView,
    buildPublicQuoteRevenueView,
    deleteQuoteRevenueRecord,
    findQuoteRevenueRecord,
    findQuoteRevenueRecordByPublicToken,
    syncQuoteRevenueRecord,
} from '../utils/postgresRevenueRecords.js';
import { persistQuotePdf } from '../utils/quotePdfStorage.js';
import {
    createPostgresFirstQuote,
    updatePostgresFirstQuote,
} from '../utils/postgresFirstQuoteService.js';
import {
    createPostgresFirstTraveler,
    updatePostgresFirstTraveler,
} from '../utils/postgresFirstTravelerService.js';
import { searchAssistantKnowledge } from '../utils/pgvectorRetrieval.js';

const router = express.Router();

const getTenantWhatsAppNumber = async (tenantId) => {
    if (!tenantId) {
        return '';
    }

    const settings = await SiteSettings.findOne({ tenantId }).select('whatsapp');
    if (settings?.whatsapp) {
        return settings.whatsapp;
    }

    const whatsappAccount = await SocialAccount.findOne({
        tenantId,
        provider: "whatsapp",
    })
        .sort({ lastVerifiedAt: -1, createdAt: -1 })
        .select("phoneNumber metadata");

    return (
        whatsappAccount?.phoneNumber ||
        whatsappAccount?.metadata?.verification?.displayPhoneNumber ||
        ''
    );
};

const resolveInquiryTenantContext = async (req, body = {}) => {
    if (req.tenantId) {
        return {
            tenantId: req.tenantId,
            tenant: req.tenant || null,
        };
    }

    if (body.operatorTenantId) {
        const tenant = await Tenant.findById(body.operatorTenantId).select("_id name slug status").lean();
        if (tenant?.status === "active") {
            return {
                tenantId: tenant._id,
                tenant,
            };
        }
    }

    if (body.operatorTenantSlug) {
        const tenant = await Tenant.findOne({
            slug: String(body.operatorTenantSlug).trim().toLowerCase(),
            status: "active",
        })
            .select("_id name slug status")
            .lean();

        if (tenant) {
            return {
                tenantId: tenant._id,
                tenant,
            };
        }
    }

    return {
        tenantId: null,
        tenant: null,
    };
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

const syncQuoteRevenueViews = async (quote = {}) => {
    await syncMongoDocumentToShadowStore({
        entityType: "quotes",
        document: quote,
        model: QuoteProposal,
    });

    try {
        await syncQuoteRevenueRecord(quote);
    } catch (error) {
        console.error("Quote revenue record sync failed:", error.message);
    }
};

const mergeInquiryContext = (inquiry = {}, fallback = {}) => ({
    ...inquiry,
    restaurantId: inquiry.restaurantId || fallback.restaurantId || "",
    restaurantName: inquiry.restaurantName || fallback.restaurantName || "",
    restaurantIntentType:
        inquiry.restaurantIntentType || fallback.restaurantIntentType || "",
    restaurantAutopilot:
        inquiry.restaurantAutopilot || fallback.restaurantAutopilot || null,
    automationSummary: inquiry.automationSummary || fallback.automationSummary || "",
    followUpMessage: inquiry.followUpMessage || fallback.followUpMessage || "",
});

const mergePrimaryInquiryCollection = (primaryInquiries = [], fallbackInquiries = []) => {
    const fallbackById = new Map(
        (Array.isArray(fallbackInquiries) ? fallbackInquiries : []).map((inquiry = {}) => [
            String(inquiry._id || ""),
            inquiry,
        ])
    );

    return (Array.isArray(primaryInquiries) ? primaryInquiries : []).map((inquiry = {}) =>
        mergeInquiryContext(inquiry, fallbackById.get(String(inquiry._id || "")) || {})
    );
};

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

        if (String(req.query.source || '').toLowerCase() === 'postgres') {
            const primaryInquiries = await fetchPrimaryInquiries(String(req.tenantId || ''));
            return res.status(200).json(
                preferPrimaryCollection(
                    mergePrimaryInquiryCollection(primaryInquiries, enrichedInquiries),
                    enrichedInquiries
                )
            );
        }

        res.status(200).json(enrichedInquiries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new inquiry (Customer)
router.post('/', async (req, res) => {
    try {
        const inquiryContext = await resolveInquiryTenantContext(req, req.body);
        if (!inquiryContext.tenantId) {
            throw new Error("Tenant ID is required for traveler creation.");
        }

        const inquiryData = buildInquiryPayload(req.body, req.body.sourceChannel || 'website');
        const whatsappNumber = await getTenantWhatsAppNumber(inquiryContext.tenantId);
        const automation = enhanceHotelInquiryAutomation(
            generateInquiryLeadAutomation(inquiryData, {
                tenantName: inquiryContext.tenant?.name || req.tenant?.name || 'MAZ Expeditions',
                whatsappNumber,
            }),
            inquiryData
        );
        const restaurantAutomation = enhanceRestaurantInquiryAutomation(automation, inquiryData);
        const scoring = scoreInquiryLead(inquiryData);

        if (inquiryData.referralCode) {
            scoring.leadScore = Math.min(100, (scoring.leadScore || 0) + 15);
            scoring.leadScoreReasons = scoring.leadScoreReasons || [];
            scoring.leadScoreReasons.push(`Referred traveler (Code: ${inquiryData.referralCode})`);
            scoring.leadTemperature = 'hot';
        }
        const newInquiry = await createPostgresFirstTraveler(
            {
                ...inquiryData,
                ...scoring,
                automationSummary: restaurantAutomation.summary,
                followUpMessage: restaurantAutomation.followUpMessage,
                restaurantAutopilot: restaurantAutomation.restaurantAutopilot || null,
                tenantId: inquiryContext.tenantId,
            },
            process.env
        );
        const primaryInquiry = await safePrimaryLookup(
            () => findTravelerInquiryRecord(newInquiry._id, inquiryContext.tenantId, process.env),
            {
                onError: (error) => {
                    console.error("Primary inquiry create refresh failed:", error.message);
                },
            }
        );
        res.status(201).json({
            inquiry: primaryInquiry
                ? mergeInquiryContext(
                    buildTravelerInquiryView(primaryInquiry),
                    newInquiry.toObject ? newInquiry.toObject() : newInquiry
                )
                : newInquiry,
            automation: restaurantAutomation,
        });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

router.post('/whatsapp-lead', async (req, res) => {
    try {
        const inquiryContext = await resolveInquiryTenantContext(req, req.body);
        if (!inquiryContext.tenantId) {
            throw new Error("Tenant ID is required for traveler creation.");
        }

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

        const whatsappNumber = await getTenantWhatsAppNumber(inquiryContext.tenantId);
        const automation = enhanceHotelInquiryAutomation(
            generateInquiryLeadAutomation(inquiryData, {
                tenantName: inquiryContext.tenant?.name || req.tenant?.name || 'MAZ Expeditions',
                whatsappNumber,
            }),
            inquiryData
        );
        const restaurantAutomation = enhanceRestaurantInquiryAutomation(automation, inquiryData);
        const scoring = scoreInquiryLead(inquiryData);

        if (inquiryData.referralCode) {
            scoring.leadScore = Math.min(100, (scoring.leadScore || 0) + 15);
            scoring.leadScoreReasons = scoring.leadScoreReasons || [];
            scoring.leadScoreReasons.push(`Referred traveler (Code: ${inquiryData.referralCode})`);
            scoring.leadTemperature = 'hot';
        }
        const newInquiry = await createPostgresFirstTraveler(
            {
                ...inquiryData,
                ...scoring,
                automationSummary: restaurantAutomation.summary,
                followUpMessage: restaurantAutomation.followUpMessage,
                restaurantAutopilot: restaurantAutomation.restaurantAutopilot || null,
                tenantId: inquiryContext.tenantId,
            },
            process.env
        );
        const primaryInquiry = await safePrimaryLookup(
            () => findTravelerInquiryRecord(newInquiry._id, inquiryContext.tenantId, process.env),
            {
                onError: (error) => {
                    console.error("Primary WhatsApp inquiry refresh failed:", error.message);
                },
            }
        );

        res.status(201).json({
            inquiry: primaryInquiry
                ? mergeInquiryContext(
                    buildTravelerInquiryView(primaryInquiry),
                    newInquiry.toObject ? newInquiry.toObject() : newInquiry
                )
                : newInquiry,
            automation: restaurantAutomation,
        });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

// Public Quote Access (No Auth Required)
router.get('/public-quote/:token', async (req, res) => {
    try {
        const quoteLookup = await safePrimaryLookup(
            () => findQuoteRevenueRecordByPublicToken(req.params.token, process.env),
            {
                onError: (error) => {
                    console.error("Primary public quote lookup failed:", error.message);
                },
            }
        );
        if (quoteLookup) {
            return res.status(200).json(buildPublicQuoteRevenueView(quoteLookup));
        }

        const quote = await QuoteProposal.findOne(
            { publicToken: req.params.token }
        )
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

        const quoteLookup = await safePrimaryLookup(
            () => findQuoteRevenueRecordByPublicToken(req.params.token, process.env),
            {
                onError: (error) => {
                    console.error("Primary public quote response lookup failed:", error.message);
                },
            }
        );
        const currentQuote = quoteLookup?.source_id
            ? await QuoteProposal.findById(quoteLookup.source_id).lean()
            : await QuoteProposal.findOne({ publicToken: req.params.token }).lean();

        if (!currentQuote) {
            return res.status(404).json({ message: 'Quote not found.' });
        }

        const quote = await updatePostgresFirstQuote(
            currentQuote._id,
            currentQuote.tenantId,
            update,
            process.env
        );

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

        await syncQuoteRevenueViews(quote);

        const refreshedQuote = await safePrimaryLookup(
            () => findQuoteRevenueRecordByPublicToken(req.params.token, process.env),
            {
                onError: (error) => {
                    console.error("Primary public quote refresh lookup failed:", error.message);
                },
            }
        );

        res.status(200).json({
            message: `Quote successfully ${action === 'accept' ? 'accepted' : 'feedback received'}.`,
            quote: refreshedQuote ? buildPublicQuoteRevenueView(refreshedQuote) : quote
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

        const updated = await updatePostgresFirstTraveler(
            req.params.id,
            req.tenantId,
            nextFields,
            process.env
        );
        const primaryInquiry = updated
            ? await safePrimaryLookup(
                () => findTravelerInquiryRecord(updated._id, req.tenantId, process.env),
                {
                    onError: (error) => {
                        console.error("Primary inquiry update refresh failed:", error.message);
                    },
                }
            )
            : null;
        res.status(200).json(primaryInquiry ? buildTravelerInquiryView(primaryInquiry) : updated);
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

        if (String(req.query.source || '').toLowerCase() === 'postgres') {
            const primaryQuotes = await fetchPrimaryInquiryQuotes(
                req.params.id,
                String(req.tenantId || ''),
                process.env
            );
            return res.status(200).json(preferPrimaryCollection(primaryQuotes, quotes));
        }

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

        const quote = await createPostgresFirstQuote(
            withTenantId(req, {
                inquiryId: inquiry._id,
                leadSource: inquiry.sourceChannel || "website",
                campaignLabel: inquiry.campaignLabel || "",
                ...proposal,
            }),
            process.env
        );

        await syncQuoteRevenueViews(quote.toObject());
        const primaryQuote = await safePrimaryLookup(
            () => findQuoteRevenueRecord(quote._id, req.tenantId, process.env),
            {
                onError: (error) => {
                    console.error("Primary quote create refresh failed:", error.message);
                },
            }
        );

        res.status(201).json(primaryQuote ? buildQuoteRevenueView(primaryQuote) : quote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark Quote as Sent (Admin)
router.post('/:id/quotes/:quoteId/send', requireTenantAdmin, async (req, res) => {
    try {
        const quote = await updatePostgresFirstQuote(
            req.params.quoteId,
            req.tenantId,
            { status: 'sent', conversionStage: 'sent', sentAt: new Date() },
            process.env
        );

        if (!quote) {
            return res.status(404).json({ message: 'Quote not found.' });
        }

        await syncQuoteRevenueViews(quote);
        const primaryQuote = await safePrimaryLookup(
            () => findQuoteRevenueRecord(quote._id, req.tenantId, process.env),
            {
                onError: (error) => {
                    console.error("Primary quote send refresh failed:", error.message);
                },
            }
        );

        res.status(200).json({
            message: 'Quote marked as sent to traveler.',
            quote: primaryQuote ? buildQuoteRevenueView(primaryQuote) : quote
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Generate PDF for Quote (Admin)
router.post('/:id/quotes/:quoteId/generate-pdf', requireTenantAdmin, async (req, res) => {
    try {
        const quote = await persistQuotePdf({
            quoteId: req.params.quoteId,
            tenantId: req.tenantId,
            env: process.env,
        });

        await updatePostgresFirstQuote(
            quote._id,
            quote.tenantId,
            {},
            process.env
        );

        res.status(200).json({
            message: 'PDF generated and stored successfully.',
            quote,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id/suggested-tours', requireTenantAdmin, async (req, res) => {
    try {
        const inquiry = await CustomInquiry.findOne(
            buildTenantFilter(req, { _id: req.params.id })
        ).lean();

        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found.' });
        }

        // 1. Perform Semantic Search using the traveler's message and destinations
        const searchQuery = [
            inquiry.message,
            ...(Array.isArray(inquiry.destinations) ? inquiry.destinations : []),
            inquiry.budget ? `Budget: ${inquiry.budget}` : "",
        ].filter(Boolean).join(" ");

        const vectorResults = await searchAssistantKnowledge({
            tenantId: String(req.tenantId),
            query: searchQuery,
            sourceTypes: ["tour-package"],
            limit: 5,
            env: process.env,
        });

        const tourIds = vectorResults.tourIds || [];
        if (!tourIds.length) {
            return res.status(200).json([]);
        }

        // 2. Fetch the actual Tour documents
        const suggestedTours = await TourPackage.find(
            buildTenantFilter(req, { _id: { $in: tourIds } })
        ).lean();

        // 3. Sort by the order returned by pgvector (relevance)
        const sortedTours = tourIds
            .map(id => suggestedTours.find(t => String(t._id) === String(id)))
            .filter(Boolean);

        res.status(200).json(sortedTours);
    } catch (error) {
        console.error("Semantic tour suggestion failed:", error.message);
        res.status(500).json({ message: error.message });
    }
});

// Delete (Admin)
router.delete('/:id', requireTenantAdmin, async (req, res) => {
    try {
        const inquiry = await CustomInquiry.findOneAndDelete(buildTenantFilter(req, { _id: req.params.id })).lean();

        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        await deleteTravelerInquiryRecord(inquiry._id, inquiry.tenantId);
        await deleteMongoDocumentFromShadowStore({
            entityType: 'travelers',
            sourceId: inquiry._id,
        });

        const [quotes, sequences] = await Promise.all([
            QuoteProposal.find(buildTenantFilter(req, { inquiryId: inquiry._id })).lean(),
            LeadFollowUpSequence.find(buildTenantFilter(req, { inquiryId: inquiry._id })).lean(),
        ]);
        for (const quote of quotes) {
            await deleteQuoteRevenueRecord(quote._id, quote.tenantId);
            await deleteMongoDocumentFromShadowStore({
                entityType: 'quotes',
                sourceId: quote._id,
            });
        }

        for (const sequence of sequences) {
            await deleteLeadFollowUpSequenceRecord(sequence._id, sequence.tenantId);
            await deleteMongoDocumentFromShadowStore({
                entityType: 'lead-follow-up-sequences',
                sourceId: sequence._id,
            });
        }

        await LeadFollowUpSequence.deleteMany(buildTenantFilter(req, { inquiryId: inquiry._id }));

        res.status(200).json({ message: 'Inquiry deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
