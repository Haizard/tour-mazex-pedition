import express from 'express';
import Booking from '../models/Booking.js';
import RepeatCustomerCampaign from "../models/RepeatCustomerCampaign.js";
import ReviewRequest from "../models/ReviewRequest.js";
import TourPackage from '../models/TourPackage.js';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { buildTenantFilter, withTenantId } from '../utils/tenantContext.js';
import { buildRepeatCustomerAutomation } from "../utils/repeatCustomerAutomation.js";
import { buildReviewRequestDraft } from "../utils/reviewAutomation.js";

const router = express.Router();

// Get all bookings (Admin)
router.get('/', requireTenantAdmin, async (req, res) => {
    try {
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

        const newBooking = new Booking(withTenantId(req, bookingData));
        await newBooking.save();
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

// Update a booking status (Admin)
router.patch('/:id', requireTenantAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const updatedBooking = await Booking.findOneAndUpdate(
            buildTenantFilter(req, { _id: req.params.id }),
            { status },
            { new: true }
        );
        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
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
                return res.status(200).json(existing);
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

            res.status(201).json(reviewRequest);
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
                return res.status(200).json(existing);
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

            res.status(201).json(campaign);
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

            res.status(200).json(reviewRequest);
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

            res.status(200).json(campaign);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

// Delete a booking (Admin)
router.delete('/:id', requireTenantAdmin, async (req, res) => {
    try {
        await Booking.findOneAndDelete(buildTenantFilter(req, { _id: req.params.id }));
        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
