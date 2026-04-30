import express from 'express';
import process from "node:process";
import Booking from '../models/Booking.js';
import RepeatCustomerCampaign from "../models/RepeatCustomerCampaign.js";
import ReviewRequest from "../models/ReviewRequest.js";
import TourPackage from '../models/TourPackage.js';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { buildTenantFilter, resolveTenantBaseUrl, withTenantId } from '../utils/tenantContext.js';
import { buildRepeatCustomerAutomation } from "../utils/repeatCustomerAutomation.js";
import { buildReviewRequestDraft } from "../utils/reviewAutomation.js";
import TravelerFeedback from "../models/TravelerFeedback.js";
import LeadFollowUpSequence from "../models/LeadFollowUpSequence.js";
import Tenant from "../models/Tenant.js";
import { generateReviewSequence } from "../utils/followUpSequencing.js";
import { analyzeFeedbackSentiment, generateMonthlyImprovementReport } from "../utils/sentimentAnalysis.js";
import {
    deleteMongoDocumentFromShadowStore,
    syncMongoDocumentToShadowStore,
} from "../utils/postgresShadowWrites.js";
import {
    deleteBookingRevenueRecord,
    deletePaymentRevenueRecord,
    deleteQuoteRevenueRecord,
    syncBookingRevenueRecord,
} from "../utils/postgresRevenueRecords.js";
import {
    buildRepeatCustomerCampaignView,
    buildReviewRequestView,
    deleteRepeatCustomerCampaignRecord,
    deleteReviewRequestRecord,
    findRepeatCustomerCampaignRecord,
    findReviewRequestRecord,
    syncRepeatCustomerCampaignRecord,
    syncReviewRequestRecord,
} from "../utils/postgresBookingLifecycleRecords.js";
import {
    fetchPrimaryBookings,
    fetchPrimaryRepeatCustomerCampaigns,
    fetchPrimaryReviewRequests,
    fetchPrimaryTravelerFeedback,
} from "../utils/postgresPrimaryReads.js";
import {
    buildPublicTravelerFeedbackView,
    deleteLeadFollowUpSequenceRecord,
    deleteTravelerFeedbackRecord,
    findTravelerFeedbackByPublicToken,
    syncLeadFollowUpSequenceRecord,
    syncTravelerFeedbackRecord,
} from "../utils/postgresEngagementRecords.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import QuoteProposal from "../models/QuoteProposal.js";

const router = express.Router();

const buildBookingRevenueDefaults = (bookingData = {}) => ({
    leadSource: bookingData.leadSource || bookingData.sourceChannel || "website",
    campaignLabel: bookingData.campaignLabel || "",
    firstTouchAt: bookingData.firstTouchAt || new Date(),
    revenueStage: bookingData.revenueStage || "new",
    paymentStatus: bookingData.paymentStatus || "not-started",
    paymentRequired: Object.prototype.hasOwnProperty.call(bookingData, "paymentRequired")
        ? Boolean(bookingData.paymentRequired)
        : true,
});

const syncBookingRevenueViews = async (booking = {}) => {
    await syncMongoDocumentToShadowStore({
        entityType: "bookings",
        document: booking,
        model: Booking,
    });

    try {
        await syncBookingRevenueRecord(booking);
    } catch (error) {
        console.error("Booking revenue record sync failed:", error.message);
    }
};

const syncReviewRequestViews = async (reviewRequest = {}) => {
    await syncMongoDocumentToShadowStore({
        entityType: "review-requests",
        document: reviewRequest,
        model: ReviewRequest,
    });

    try {
        await syncReviewRequestRecord(reviewRequest);
    } catch (error) {
        console.error("Review request record sync failed:", error.message);
    }
};

const syncRepeatCustomerCampaignViews = async (campaign = {}) => {
    await syncMongoDocumentToShadowStore({
        entityType: "repeat-customer-campaigns",
        document: campaign,
        model: RepeatCustomerCampaign,
    });

    try {
        await syncRepeatCustomerCampaignRecord(campaign);
    } catch (error) {
        console.error("Repeat customer campaign record sync failed:", error.message);
    }
};

const syncTravelerFeedbackViews = async (feedback = {}) => {
    await syncMongoDocumentToShadowStore({
        entityType: "traveler-feedback",
        document: feedback,
        model: TravelerFeedback,
    });

    try {
        await syncTravelerFeedbackRecord(feedback);
    } catch (error) {
        console.error("Traveler feedback record sync failed:", error.message);
    }
};

const syncLeadFollowUpSequenceViews = async (sequence = {}) => {
    await syncMongoDocumentToShadowStore({
        entityType: "lead-follow-up-sequences",
        document: sequence,
        model: LeadFollowUpSequence,
    });

    try {
        await syncLeadFollowUpSequenceRecord(sequence);
    } catch (error) {
        console.error("Lead follow-up sequence record sync failed:", error.message);
    }
};

// Get all bookings (Admin)
router.get('/', requireTenantAdmin, async (req, res) => {
    try {
        if (String(req.query.source || "").toLowerCase() === "postgres") {
            const bookings = await fetchPrimaryBookings(String(req.tenantId || ""));
            return res.status(200).json(bookings);
        }

        const bookings = await Booking.find(buildTenantFilter(req)).sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get(
    "/review-requests",
    requireTenantAdmin,
    requireSubscriptionFeature("review-automation"),
    async (req, res) => {
        try {
            if (String(req.query.source || "").toLowerCase() === "postgres") {
                const reviewRequests = await fetchPrimaryReviewRequests(String(req.tenantId || ""));
                return res.status(200).json(reviewRequests);
            }

            const reviewRequests = await ReviewRequest.find(buildTenantFilter(req))
                .sort({ createdAt: -1 })
                .lean();
            res.status(200).json(reviewRequests);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

router.get(
    "/repeat-customer-campaigns",
    requireTenantAdmin,
    requireSubscriptionFeature("repeat-customer-automation"),
    async (req, res) => {
        try {
            if (String(req.query.source || "").toLowerCase() === "postgres") {
                const campaigns = await fetchPrimaryRepeatCustomerCampaigns(String(req.tenantId || ""));
                return res.status(200).json(campaigns);
            }

            const campaigns = await RepeatCustomerCampaign.find(buildTenantFilter(req))
                .sort({ createdAt: -1 })
                .lean();
            res.status(200).json(campaigns);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

// Create a new booking (Customer)
router.post('/', async (req, res) => {
    const bookingData = { ...req.body };

    if (!bookingData.pax) {
        bookingData.pax = Number(bookingData.adults || 0) + Number(bookingData.children || 0);
    }

    if (!bookingData.pax || bookingData.pax < 1) {
        bookingData.pax = 1;
    }

    bookingData.adults = Number(bookingData.adults || bookingData.pax || 1);
    bookingData.children = Number(bookingData.children || 0);

    try {
        // If it's a specific package booking, check for group capacity
        const tour = await TourPackage.findOne(buildTenantFilter(req, { title: bookingData.packageTour }));

        if (tour && tour.isGroupTour) {
            if (tour.currentBookings + bookingData.pax > tour.maxCapacity) {
                return res.status(400).json({
                    message: `Sorry, only ${tour.maxCapacity - tour.currentBookings} spots left for this group tour.`
                });
            }

            // Increment bookings
            tour.currentBookings += bookingData.pax;
            await tour.save();
        }

        const newBooking = new Booking(withTenantId(req, {
            ...bookingData,
            ...buildBookingRevenueDefaults(bookingData),
            referralCode: bookingData.referralCode || undefined
        }));
        await newBooking.save();
        await syncBookingRevenueViews(newBooking.toObject());
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

// Update a booking status (Admin)
router.patch('/:id', requireTenantAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const bookingPatch = { status };
        if (status === "Confirmed") {
            bookingPatch.revenueStage = "awaiting-payment";
        }
        if (status === "Cancelled") {
            bookingPatch.revenueStage = "cancelled";
        }
        if (status === "Completed") {
            bookingPatch.revenueStage = "paid";
        }
        const updatedBooking = await Booking.findOneAndUpdate(
            buildTenantFilter(req, { _id: req.params.id }),
            { $set: bookingPatch },
            { new: true }
        );
        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        await syncBookingRevenueViews(updatedBooking.toObject());

        // Trigger Growth Suite: Reputation Guardian & Repeat Customer Automation
        if (status === "Completed") {
            const tenant = await Tenant.findById(updatedBooking.tenantId).lean();
            const tenantName = tenant?.brandName || tenant?.name || "our team";
            const baseUrl = resolveTenantBaseUrl(req);

            // 1. Reputation Guardian (Review Request)
            const existingFeedback = await TravelerFeedback.findOne({ bookingId: updatedBooking._id });
            if (!existingFeedback) {
                const feedback = new TravelerFeedback({
                    tenantId: updatedBooking.tenantId,
                    bookingId: updatedBooking._id,
                });
                await feedback.save();
                await syncTravelerFeedbackViews(feedback.toObject());

                const touchpoints = generateReviewSequence(updatedBooking, feedback.publicToken, {
                    tenantName,
                    baseUrl,
                });

                const sequence = new LeadFollowUpSequence({
                    tenantId: updatedBooking.tenantId,
                    inquiryId: null,
                    bookingId: updatedBooking._id,
                    touchpoints,
                });
                await sequence.save();
                await syncLeadFollowUpSequenceViews(sequence.toObject());
            }

            // 2. Repeat Customer Automation (Lifecycle Segmentation)
            const existingCampaign = await RepeatCustomerCampaign.findOne({ bookingId: updatedBooking._id });
            if (!existingCampaign) {
                // Fetch historical bookings for this guest across the tenant
                const bookingHistory = await Booking.find({
                    tenantId: updatedBooking.tenantId,
                    $or: [
                        { email: updatedBooking.email },
                        { phone: updatedBooking.phone }
                    ],
                    status: "Completed"
                }).lean();

                const automation = buildRepeatCustomerAutomation({
                    booking: updatedBooking,
                    bookingHistory,
                    tenantName
                });

                const campaign = new RepeatCustomerCampaign({
                    tenantId: updatedBooking.tenantId,
                    bookingId: updatedBooking._id,
                    ...automation
                });
                await campaign.save();
            }
        }

        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post(
    "/:id/review-request",
    requireTenantAdmin,
    requireSubscriptionFeature("review-automation"),
    async (req, res) => {
        try {
            const booking = await Booking.findOne(buildTenantFilter(req, { _id: req.params.id })).lean();

            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            if (booking.status !== "Confirmed") {
                return res.status(400).json({
                    message: "Only confirmed bookings can receive automated review requests.",
                });
            }

            const existing = await ReviewRequest.findOne(
                buildTenantFilter(req, { bookingId: booking._id })
            );

            if (existing) {
                const existingView = await findReviewRequestRecord(existing._id, req.tenantId, process.env);
                return res.status(200).json(existingView ? buildReviewRequestView(existingView) : existing);
            }

            const draft = buildReviewRequestDraft({
                booking,
                tenantName: req.tenant?.name,
            });

            const reviewRequest = new ReviewRequest(
                withTenantId(req, {
                    bookingId: booking._id,
                    ...draft,
                })
            );
            await reviewRequest.save();
            await syncReviewRequestViews(reviewRequest.toObject());
            const reviewRequestView = await findReviewRequestRecord(reviewRequest._id, req.tenantId, process.env);
            res.status(201).json(reviewRequestView ? buildReviewRequestView(reviewRequestView) : reviewRequest);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

router.post(
    "/:id/repeat-customer-campaign",
    requireTenantAdmin,
    requireSubscriptionFeature("repeat-customer-automation"),
    async (req, res) => {
        try {
            const booking = await Booking.findOne(buildTenantFilter(req, { _id: req.params.id })).lean();

            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            if (booking.status !== "Confirmed") {
                return res.status(400).json({
                    message: "Only confirmed bookings can be used for repeat customer automation.",
                });
            }

            const existing = await RepeatCustomerCampaign.findOne(
                buildTenantFilter(req, { bookingId: booking._id })
            );

            if (existing) {
                const existingView = await findRepeatCustomerCampaignRecord(existing._id, req.tenantId, process.env);
                return res.status(200).json(existingView ? buildRepeatCustomerCampaignView(existingView) : existing);
            }

            const bookingHistory = await Booking.find(
                buildTenantFilter(req, { email: booking.email, status: "Confirmed" })
            )
                .sort({ createdAt: -1 })
                .lean();

            const draft = buildRepeatCustomerAutomation({
                booking,
                bookingHistory,
                tenantName: req.tenant?.name,
            });

            const campaign = new RepeatCustomerCampaign(
                withTenantId(req, {
                    bookingId: booking._id,
                    ...draft,
                })
            );

            await campaign.save();
            await syncRepeatCustomerCampaignViews(campaign.toObject());
            const campaignView = await findRepeatCustomerCampaignRecord(campaign._id, req.tenantId, process.env);
            res.status(201).json(campaignView ? buildRepeatCustomerCampaignView(campaignView) : campaign);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

router.patch(
    "/review-requests/:id",
    requireTenantAdmin,
    requireSubscriptionFeature("review-automation"),
    async (req, res) => {
        try {
            const updates = {};
            const allowedStatuses = new Set(["draft", "scheduled", "sent", "completed", "skipped"]);

            if (req.body.status && allowedStatuses.has(req.body.status)) {
                updates.status = req.body.status;
            }

            if (Array.isArray(req.body.platforms)) {
                updates.platforms = req.body.platforms;
            }

            if (typeof req.body.subject === "string") {
                updates.subject = req.body.subject;
            }

            if (typeof req.body.message === "string") {
                updates.message = req.body.message;
            }

            if (updates.status === "sent") {
                updates.sentAt = new Date();
            }

            if (updates.status === "completed") {
                updates.completedAt = new Date();
            }

            const reviewRequest = await ReviewRequest.findOneAndUpdate(
                buildTenantFilter(req, { _id: req.params.id }),
                { $set: updates },
                { new: true }
            );

            if (!reviewRequest) {
                return res.status(404).json({ message: "Review request not found" });
            }

            await syncReviewRequestViews(reviewRequest.toObject());
            const reviewRequestView = await findReviewRequestRecord(reviewRequest._id, req.tenantId, process.env);
            res.status(200).json(reviewRequestView ? buildReviewRequestView(reviewRequestView) : reviewRequest);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

router.patch(
    "/repeat-customer-campaigns/:id",
    requireTenantAdmin,
    requireSubscriptionFeature("repeat-customer-automation"),
    async (req, res) => {
        try {
            const updates = {};
            const allowedStatuses = new Set(["draft", "scheduled", "sent", "converted", "archived"]);

            if (req.body.status && allowedStatuses.has(req.body.status)) {
                updates.status = req.body.status;
            }

            if (typeof req.body.subject === "string") {
                updates.subject = req.body.subject;
            }

            if (typeof req.body.message === "string") {
                updates.message = req.body.message;
            }

            if (updates.status === "sent") {
                updates.sentAt = new Date();
            }

            if (updates.status === "converted") {
                updates.convertedAt = new Date();
            }

            const campaign = await RepeatCustomerCampaign.findOneAndUpdate(
                buildTenantFilter(req, { _id: req.params.id }),
                { $set: updates },
                { new: true }
            );

            if (!campaign) {
                return res.status(404).json({ message: "Repeat customer campaign not found" });
            }

            await syncRepeatCustomerCampaignViews(campaign.toObject());
            const campaignView = await findRepeatCustomerCampaignRecord(campaign._id, req.tenantId, process.env);
            res.status(200).json(campaignView ? buildRepeatCustomerCampaignView(campaignView) : campaign);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

// Delete a booking (Admin)
router.delete('/:id', requireTenantAdmin, async (req, res) => {
    try {
        const booking = await Booking.findOneAndDelete(buildTenantFilter(req, { _id: req.params.id })).lean();

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        await deleteBookingRevenueRecord(booking._id, booking.tenantId);
        await deleteMongoDocumentFromShadowStore({
            entityType: 'bookings',
            sourceId: booking._id,
        });

        const [payments, quotes, reviewRequests, repeatCampaigns, feedbacks, sequences] = await Promise.all([
            PaymentTransaction.find(buildTenantFilter(req, { bookingId: booking._id })).lean(),
            QuoteProposal.find(buildTenantFilter(req, { bookingId: booking._id })).lean(),
            ReviewRequest.find(buildTenantFilter(req, { bookingId: booking._id })).lean(),
            RepeatCustomerCampaign.find(buildTenantFilter(req, { bookingId: booking._id })).lean(),
            TravelerFeedback.find(buildTenantFilter(req, { bookingId: booking._id })).lean(),
            LeadFollowUpSequence.find(buildTenantFilter(req, { bookingId: booking._id })).lean(),
        ]);

        for (const payment of payments) {
            await deletePaymentRevenueRecord(payment._id, payment.tenantId);
            await deleteMongoDocumentFromShadowStore({
                entityType: 'payments',
                sourceId: payment._id,
            });
        }

        for (const quote of quotes) {
            await deleteQuoteRevenueRecord(quote._id, quote.tenantId);
            await deleteMongoDocumentFromShadowStore({
                entityType: 'quotes',
                sourceId: quote._id,
            });
        }

        for (const reviewRequest of reviewRequests) {
            await deleteReviewRequestRecord(reviewRequest._id, reviewRequest.tenantId);
            await deleteMongoDocumentFromShadowStore({
                entityType: 'review-requests',
                sourceId: reviewRequest._id,
            });
        }

        for (const campaign of repeatCampaigns) {
            await deleteRepeatCustomerCampaignRecord(campaign._id, campaign.tenantId);
            await deleteMongoDocumentFromShadowStore({
                entityType: 'repeat-customer-campaigns',
                sourceId: campaign._id,
            });
        }

        for (const feedback of feedbacks) {
            await deleteTravelerFeedbackRecord(feedback._id, feedback.tenantId);
            await deleteMongoDocumentFromShadowStore({
                entityType: 'traveler-feedback',
                sourceId: feedback._id,
            });
        }

        for (const sequence of sequences) {
            await deleteLeadFollowUpSequenceRecord(sequence._id, sequence.tenantId);
            await deleteMongoDocumentFromShadowStore({
                entityType: 'lead-follow-up-sequences',
                sourceId: sequence._id,
            });
        }

        await ReviewRequest.deleteMany(buildTenantFilter(req, { bookingId: booking._id }));
        await RepeatCustomerCampaign.deleteMany(buildTenantFilter(req, { bookingId: booking._id }));
        await TravelerFeedback.deleteMany(buildTenantFilter(req, { bookingId: booking._id }));
        await LeadFollowUpSequence.deleteMany(buildTenantFilter(req, { bookingId: booking._id }));

        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Public Feedback Routes
router.get("/public-feedback/:token", async (req, res) => {
    try {
        const feedback = await findTravelerFeedbackByPublicToken(req.params.token, process.env);
        if (!feedback) {
            return res.status(404).json({ message: "Feedback link invalid" });
        }
        if (feedback.status === "submitted") {
            return res.status(400).json({ message: "Feedback already submitted" });
        }
        res.status(200).json(buildPublicTravelerFeedbackView(feedback));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/public-feedback/:token", async (req, res) => {
    try {
        const { rating, privateNote, publicReview } = req.body;
        const feedbackLookup = await findTravelerFeedbackByPublicToken(req.params.token, process.env);
        const feedback = feedbackLookup?.source_id
            ? await TravelerFeedback.findById(feedbackLookup.source_id)
            : await TravelerFeedback.findOne({ publicToken: req.params.token });
        
        if (!feedback) {
            return res.status(404).json({ message: "Feedback link invalid" });
        }

        if (feedback.status === "submitted") {
            return res.status(400).json({ message: "Feedback already submitted" });
        }

        feedback.rating = rating;
        feedback.privateNote = privateNote;
        feedback.publicReview = typeof publicReview === "string" ? publicReview.trim() : "";
        feedback.status = "submitted";
        feedback.submittedAt = new Date();
        
        if (rating >= 4) {
            // Generate a simple referral code if they loved it
            feedback.referralCode = `SR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        }

        // AI Sentiment Analysis
        if (privateNote && privateNote.length > 10) {
            const analysis = await analyzeFeedbackSentiment(privateNote);
            feedback.aiSentiment = analysis.sentiment;
            feedback.aiScore = analysis.score;
            feedback.aiSummary = analysis.summary;
            feedback.aiKeyTopics = analysis.keyTopics;
            feedback.aiImprovementSuggestion = analysis.improvementSuggestion;
        }

        await feedback.save();
        await syncTravelerFeedbackViews(feedback.toObject());

        const refreshedFeedback = await findTravelerFeedbackByPublicToken(req.params.token, process.env);
        res.status(200).json(
            refreshedFeedback ? buildPublicTravelerFeedbackView(refreshedFeedback) : feedback.toObject()
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/public-testimonials", async (req, res) => {
    try {
        const reviews = await fetchPrimaryTravelerFeedback(String(req.tenantId || ""));
        const anonymized = reviews
            .filter((review) => review.status === "submitted" && Number(review.rating || 0) >= 4 && review.publicReview)
            .slice(0, 12)
            .map((review) => ({
                ...review,
                name: review.bookingId?.name
                    ? `${review.bookingId.name.split(' ')[0]} ${review.bookingId.name.split(' ')[1]?.charAt(0) || ''}.`
                    : "Verified Traveler"
            }));

        res.status(200).json(anonymized);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/feedback-report", requireTenantAdmin, async (req, res) => {
    try {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const feedbacks = (await fetchPrimaryTravelerFeedback(String(req.tenantId || ""))).filter((feedback) => {
            if (feedback.status !== "submitted" || !feedback.submittedAt) {
                return false;
            }

            return new Date(feedback.submittedAt).getTime() >= last30Days.getTime();
        });

        if (feedbacks.length === 0) {
            return res.status(200).json({ report: "No feedback collected in the last 30 days to generate a report." });
        }

        const report = await generateMonthlyImprovementReport(feedbacks);
        res.status(200).json({ report });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
