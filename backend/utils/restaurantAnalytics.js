const toId = (value = "") =>
  value && typeof value === "object" && value._id
    ? String(value._id)
    : String(value || "");

const asIso = (value) => {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) && timestamp > 0
    ? new Date(timestamp).toISOString()
    : null;
};

export const scoreRestaurantDemand = ({
  inquiryCount = 0,
  directInquiryCount = 0,
  itineraryInquiryCount = 0,
  acceptedQuoteCount = 0,
  sponsoredPlacement = false,
} = {}) =>
  Number(inquiryCount || 0) * 4 +
  Number(directInquiryCount || 0) * 3 +
  Number(itineraryInquiryCount || 0) * 2 +
  Number(acceptedQuoteCount || 0) * 8 +
  Number(sponsoredPlacement === true);

const buildQuoteSummaryMap = ({ quotes = [], inquiries = [], quoteCountsByRestaurantId = {} } = {}) => {
  if (quoteCountsByRestaurantId && Object.keys(quoteCountsByRestaurantId).length) {
    return new Map(
      Object.entries(quoteCountsByRestaurantId).map(([restaurantId, summary]) => [
        String(restaurantId),
        {
          quoteCount: Number(summary?.quoteCount || 0),
          acceptedQuoteCount: Number(summary?.acceptedQuoteCount || 0),
        },
      ])
    );
  }

  const inquiryToRestaurant = new Map(
    (inquiries || [])
      .map((inquiry) => [toId(inquiry._id), toId(inquiry.restaurantId)])
      .filter(([, restaurantId]) => restaurantId)
  );

  const summaryByRestaurant = new Map();
  for (const quote of quotes || []) {
    const restaurantId = inquiryToRestaurant.get(toId(quote.inquiryId));
    if (!restaurantId) continue;
    const current = summaryByRestaurant.get(restaurantId) || {
      quoteCount: 0,
      acceptedQuoteCount: 0,
    };
    current.quoteCount += 1;
    if (["accepted", "converted"].includes(String(quote.conversionStage || quote.status || "").toLowerCase())) {
      current.acceptedQuoteCount += 1;
    }
    summaryByRestaurant.set(restaurantId, current);
  }

  return summaryByRestaurant;
};

const buildRecentActivity = (rows = []) =>
  rows
    .filter((row) => row.lastInquiryAt)
    .map((row) => ({
      restaurantId: row.restaurantId,
      restaurantName: row.restaurantName,
      activityLabel:
        row.directInquiryCount > 0 && row.lastDirectInquiryAt === row.lastInquiryAt
          ? "Direct restaurant inquiry"
          : row.itineraryInquiryCount > 0 && row.lastItineraryInquiryAt === row.lastInquiryAt
            ? "Itinerary add-on inquiry"
            : "Restaurant activity",
      occurredAt: row.lastInquiryAt,
      demandScore: row.demandScore,
    }))
    .sort(
      (left, right) =>
        new Date(right.occurredAt || 0).getTime() - new Date(left.occurredAt || 0).getTime() ||
        right.demandScore - left.demandScore
    )
    .slice(0, 5);

const buildPaymentSummaryMap = (payments = []) => {
  const summaryByRestaurant = new Map();
  const reasonBreakdown = {};

  for (const payment of payments || []) {
    const restaurantId = toId(payment.restaurantId);
    if (!restaurantId) continue;

    const amount = Number(payment.amount || 0);
    const status = String(payment.status || "pending");
    const reason = String(payment.sourceMeta?.paymentReason || payment.paymentReason || "custom");
    const current = summaryByRestaurant.get(restaurantId) || {
      paymentRequestedAmount: 0,
      paymentPendingAmount: 0,
      paymentPaidAmount: 0,
      paymentFailedAmount: 0,
      paymentRefundedAmount: 0,
      paymentRequestedCount: 0,
      paymentPaidCount: 0,
    };

    current.paymentRequestedAmount += amount;
    current.paymentRequestedCount += 1;
    if (status === "paid") {
      current.paymentPaidAmount += amount;
      current.paymentPaidCount += 1;
    } else if (status === "refunded") {
      current.paymentRefundedAmount += amount;
    } else if (["failed", "cancelled"].includes(status)) {
      current.paymentFailedAmount += amount;
    } else {
      current.paymentPendingAmount += amount;
    }

    const reasonSummary = reasonBreakdown[reason] || {
      requestedAmount: 0,
      paidAmount: 0,
      requestedCount: 0,
      paidCount: 0,
    };
    reasonSummary.requestedAmount += amount;
    reasonSummary.requestedCount += 1;
    if (status === "paid") {
      reasonSummary.paidAmount += amount;
      reasonSummary.paidCount += 1;
    }
    reasonBreakdown[reason] = reasonSummary;
    summaryByRestaurant.set(restaurantId, current);
  }

  return { summaryByRestaurant, reasonBreakdown };
};

export const buildRestaurantAnalyticsSnapshot = ({
  restaurants = [],
  inquiries = [],
  quotes = [],
  quoteCountsByRestaurantId = {},
  payments = [],
} = {}) => {
  const relevantInquiries = (inquiries || []).filter((inquiry) => toId(inquiry.restaurantId));
  const quoteSummaryByRestaurant = buildQuoteSummaryMap({
    quotes,
    inquiries: relevantInquiries,
    quoteCountsByRestaurantId,
  });
  const { summaryByRestaurant: paymentSummaryByRestaurant, reasonBreakdown } =
    buildPaymentSummaryMap(payments);

  const rows = (restaurants || []).map((restaurant) => {
    const restaurantId = toId(restaurant._id);
    const restaurantInquiries = relevantInquiries.filter(
      (inquiry) => toId(inquiry.restaurantId) === restaurantId
    );
    const directInquiries = restaurantInquiries.filter(
      (inquiry) => inquiry.restaurantIntentType === "direct-restaurant"
    );
    const itineraryInquiries = restaurantInquiries.filter(
      (inquiry) => inquiry.restaurantIntentType === "itinerary-add-on"
    );
    const quoteSummary = quoteSummaryByRestaurant.get(restaurantId) || {
      quoteCount: 0,
      acceptedQuoteCount: 0,
    };
    const paymentSummary = paymentSummaryByRestaurant.get(restaurantId) || {
      paymentRequestedAmount: 0,
      paymentPendingAmount: 0,
      paymentPaidAmount: 0,
      paymentFailedAmount: 0,
      paymentRefundedAmount: 0,
      paymentRequestedCount: 0,
      paymentPaidCount: 0,
    };
    const lastInquiryAt = restaurantInquiries
      .map((inquiry) => asIso(inquiry.createdAt))
      .filter(Boolean)
      .sort()
      .at(-1) || null;
    const lastDirectInquiryAt = directInquiries
      .map((inquiry) => asIso(inquiry.createdAt))
      .filter(Boolean)
      .sort()
      .at(-1) || null;
    const lastItineraryInquiryAt = itineraryInquiries
      .map((inquiry) => asIso(inquiry.createdAt))
      .filter(Boolean)
      .sort()
      .at(-1) || null;

    return {
      restaurantId,
      restaurantName: restaurant.name || "",
      destination: restaurant.destination || "",
      sponsoredPlacement: restaurant.sponsoredPlacement === true,
      published: restaurant.published === true,
      marketplaceVisible: restaurant.marketplaceVisible === true,
      inquiryCount: restaurantInquiries.length,
      directInquiryCount: directInquiries.length,
      itineraryInquiryCount: itineraryInquiries.length,
      quoteCount: quoteSummary.quoteCount,
      acceptedQuoteCount: quoteSummary.acceptedQuoteCount,
      ...paymentSummary,
      lastInquiryAt,
      lastDirectInquiryAt,
      lastItineraryInquiryAt,
      demandScore: scoreRestaurantDemand({
        inquiryCount: restaurantInquiries.length,
        directInquiryCount: directInquiries.length,
        itineraryInquiryCount: itineraryInquiries.length,
        acceptedQuoteCount: quoteSummary.acceptedQuoteCount,
        sponsoredPlacement: restaurant.sponsoredPlacement === true,
      }),
    };
  });

  const sortedRows = rows.sort(
    (left, right) =>
      right.demandScore - left.demandScore ||
      right.inquiryCount - left.inquiryCount ||
      left.restaurantName.localeCompare(right.restaurantName)
  );

  const sponsoredRows = sortedRows.filter((row) => row.sponsoredPlacement);
  const paymentTotals = sortedRows.reduce(
    (summary, row) => {
      summary.restaurantPaymentRequestedAmount += row.paymentRequestedAmount;
      summary.restaurantPaymentPendingAmount += row.paymentPendingAmount;
      summary.restaurantPaymentPaidAmount += row.paymentPaidAmount;
      summary.restaurantPaymentFailedAmount += row.paymentFailedAmount;
      summary.restaurantPaymentRefundedAmount += row.paymentRefundedAmount;
      summary.restaurantPaymentRequestedCount += row.paymentRequestedCount;
      summary.restaurantPaymentPaidCount += row.paymentPaidCount;
      return summary;
    },
    {
      restaurantPaymentRequestedAmount: 0,
      restaurantPaymentPendingAmount: 0,
      restaurantPaymentPaidAmount: 0,
      restaurantPaymentFailedAmount: 0,
      restaurantPaymentRefundedAmount: 0,
      restaurantPaymentRequestedCount: 0,
      restaurantPaymentPaidCount: 0,
    }
  );

  return {
    summary: {
      totalRestaurants: (restaurants || []).length,
      publicRestaurants: (restaurants || []).filter(
        (restaurant) => restaurant.published === true && restaurant.marketplaceVisible === true
      ).length,
      sponsoredRestaurants: sponsoredRows.length,
      totalRestaurantLeads: relevantInquiries.length,
      directRestaurantLeads: relevantInquiries.filter(
        (inquiry) => inquiry.restaurantIntentType === "direct-restaurant"
      ).length,
      itineraryRestaurantLeads: relevantInquiries.filter(
        (inquiry) => inquiry.restaurantIntentType === "itinerary-add-on"
      ).length,
      ...paymentTotals,
    },
    restaurants: sortedRows,
    paymentReasonBreakdown: reasonBreakdown,
    sponsoredPerformance: {
      top: sponsoredRows.slice(0, 3),
      watch: [...sponsoredRows]
        .sort(
          (left, right) =>
            left.demandScore - right.demandScore ||
            (new Date(left.lastInquiryAt || 0).getTime() - new Date(right.lastInquiryAt || 0).getTime())
        )
        .slice(0, 3),
    },
    recentActivity: buildRecentActivity(sortedRows),
  };
};
