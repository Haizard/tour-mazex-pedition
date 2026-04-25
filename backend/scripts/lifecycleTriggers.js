import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Tenant from "../models/Tenant.js";
import RepeatCustomerCampaign from "../models/RepeatCustomerCampaign.js";
import { buildRepeatCustomerAutomation } from "../utils/repeatCustomerAutomation.js";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

const runLifecycleTriggers = async () => {
    try {
        console.log("🚀 Starting Lifecycle Automation Triggers...");
        await mongoose.connect(process.env.MONGODB_URI);

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // 1. Identify "Lapsed" Guests
        // Group bookings by email and find the latest trip for each guest
        const lapsedGuests = await Booking.aggregate([
            { $match: { status: "Completed" } },
            { $sort: { travelDate: -1, createdAt: -1 } },
            {
                $group: {
                    _id: { email: "$email", tenantId: "$tenantId" },
                    latestTripDate: { $first: "$travelDate" },
                    latestBookingId: { $first: "$_id" },
                    phone: { $first: "$phone" },
                    name: { $first: "$name" }
                }
            },
            {
                $match: {
                    latestTripDate: { $lt: twelveMonthsAgo }
                }
            }
        ]);

        console.log(`🔍 Found ${lapsedGuests.length} potential lapsed guests.`);

        for (const guest of lapsedGuests) {
            // Check if they already have a "retargeting" or "Lapsed" campaign generated recently
            const existing = await RepeatCustomerCampaign.findOne({
                tenantId: guest._id.tenantId,
                guestEmail: guest._id.email,
                $or: [
                    { campaignType: "retargeting" },
                    { segment: "Lapsed" }
                ],
                createdAt: { $gt: sixMonthsAgo } // Don't spam if we tried in the last 6 months
            });

            if (existing) continue;

            // Fetch tenant info for branding
            const tenant = await Tenant.findById(guest._id.tenantId).lean();
            const booking = await Booking.findById(guest.latestBookingId).lean();

            // Fetch full history to ensure accurate segmentation
            const history = await Booking.find({
                tenantId: guest._id.tenantId,
                email: guest._id.email,
                status: "Completed"
            }).lean();

            const automation = buildRepeatCustomerAutomation({
                booking,
                bookingHistory: history,
                tenantName: tenant?.brandName || tenant?.name || "Your safari team"
            });

            const campaign = new RepeatCustomerCampaign({
                tenantId: guest._id.tenantId,
                bookingId: guest.latestBookingId,
                ...automation,
                campaignType: "retargeting", // Force retargeting type
                status: "draft"
            });

            await campaign.save();
            console.log(`✅ Generated "Lapsed" campaign draft for ${guest.name} (${guest._id.email})`);
        }

        console.log("🏁 Lifecycle Automation Triggers Completed.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Lifecycle Automation Error:", error);
        process.exit(1);
    }
};

runLifecycleTriggers();
