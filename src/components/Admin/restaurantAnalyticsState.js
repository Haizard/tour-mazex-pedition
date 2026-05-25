const toNumber = (value) => Number(value || 0);
const formatMoney = (value, currency = "USD") =>
  `${String(currency || "USD").toUpperCase()} ${toNumber(value).toFixed(2)}`;
const parseTimestamp = (value = "") => {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
};

const inferRecentActivityLabel = (restaurant = {}) => {
  const directInquiryCount = toNumber(restaurant.directInquiryCount);
  const itineraryInquiryCount = toNumber(restaurant.itineraryInquiryCount);

  if (itineraryInquiryCount > 0 && directInquiryCount === 0) {
    return "Itinerary add-on inquiry";
  }
  if (directInquiryCount > 0 && itineraryInquiryCount === 0) {
    return "Direct restaurant inquiry";
  }
  if (directInquiryCount > 0 && itineraryInquiryCount > 0) {
    return "Direct and itinerary activity";
  }
  return "Restaurant inquiry";
};

export const buildRestaurantAnalyticsCards = (payload = {}) => {
  const summary = payload.summary || {};
  return [
    {
      key: "public",
      label: "Public Restaurants",
      value: toNumber(summary.publicRestaurants),
      tone: "emerald",
    },
    {
      key: "sponsored",
      label: "Sponsored Restaurants",
      value: toNumber(summary.sponsoredRestaurants),
      tone: "amber",
    },
    {
      key: "leads",
      label: "Restaurant Leads",
      value: toNumber(summary.totalRestaurantLeads),
      tone: "slate",
    },
    {
      key: "lead-split",
      label: "Direct / Itinerary",
      value: `${toNumber(summary.directRestaurantLeads)} / ${toNumber(summary.itineraryRestaurantLeads)}`,
      tone: "indigo",
    },
    {
      key: "paid-dining",
      label: "Paid Dining Revenue",
      value: formatMoney(summary.restaurantPaymentPaidAmount),
      tone: "emerald",
    },
    {
      key: "pending-dining",
      label: "Pending Dining Revenue",
      value: formatMoney(summary.restaurantPaymentPendingAmount),
      tone: "amber",
    },
  ];
};

export const buildRestaurantSponsoredSpotlight = (restaurants = []) => {
  const sponsoredRows = (restaurants || []).filter((row) => row.sponsoredPlacement);
  return {
    top: [...sponsoredRows]
      .sort((left, right) => right.demandScore - left.demandScore || right.inquiryCount - left.inquiryCount)
      .slice(0, 3),
    watch: [...sponsoredRows]
      .sort((left, right) => left.demandScore - right.demandScore || left.inquiryCount - right.inquiryCount)
      .slice(0, 3),
  };
};

export const buildRestaurantRecentActivity = (payload = {}) => {
  const recentActivity = Array.isArray(payload.recentActivity) ? payload.recentActivity : [];
  if (recentActivity.length) {
    return [...recentActivity].sort(
      (left, right) => parseTimestamp(right.occurredAt) - parseTimestamp(left.occurredAt)
    );
  }

  return (payload.restaurants || [])
    .filter((restaurant) => restaurant.lastInquiryAt)
    .map((restaurant) => ({
      restaurantId: restaurant.restaurantId,
      restaurantName: restaurant.restaurantName,
      activityLabel: inferRecentActivityLabel(restaurant),
      occurredAt: restaurant.lastInquiryAt,
      demandScore: restaurant.demandScore || 0,
    }))
    .sort((left, right) => parseTimestamp(right.occurredAt) - parseTimestamp(left.occurredAt))
    .slice(0, 5);
};
