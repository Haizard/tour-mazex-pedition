/**
 * Customer Segmentation Engine
 * Analyzes booking history to classify guests into actionable segments.
 */

export const calculateCustomerSegment = (bookingHistory = []) => {
    if (!Array.isArray(bookingHistory) || bookingHistory.length === 0) {
        return "First-Timer";
    }

    const completedBookings = bookingHistory.filter(b => b.status === "Completed");
    const count = completedBookings.length;
    
    // Calculate total spend
    const totalSpend = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Check for "Lapsed" (last trip > 12 months ago)
    const lastTrip = completedBookings.reduce((latest, b) => {
        const date = new Date(b.travelDate || b.createdAt);
        return date > latest ? date : latest;
    }, new Date(0));

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    if (count > 0 && lastTrip < twelveMonthsAgo) {
        return "Lapsed";
    }

    if (count >= 3 || totalSpend >= 10000) {
        return "VIP";
    }

    if (count >= 2) {
        return "Loyal";
    }

    return "First-Timer";
};

export const getSegmentPerks = (segment) => {
    switch (segment) {
        case "VIP":
            return ["Dedicated Safari Planner", "Complimentary Room Upgrades", "Airport Lounge Access", "15% Preferred Loyalty Discount"];
        case "Loyal":
            return ["10% Return Guest Discount", "Priority Booking Window", "Complimentary Sundowner Experience"];
        case "First-Timer":
            return ["$100 Safari Credit for Referrals", "Welcome Orientation Package"];
        case "Lapsed":
            return ["Welcome Back Special Offer", "Waived Planning Fees"];
        default:
            return [];
    }
};
