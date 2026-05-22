const toId = (value = "") =>
  value && typeof value === "object" && value._id
    ? String(value._id)
    : String(value || "");

const isAcceptedQuote = (quote = {}) =>
  ["accepted", "converted"].includes(String(quote.conversionStage || quote.status || "").toLowerCase());

export const buildHotelAnalyticsSnapshot = ({
  hotels = [],
  inquiries = [],
  quotes = [],
} = {}) => {
  const inquiryMap = new Map();
  for (const inquiry of inquiries || []) {
    inquiryMap.set(toId(inquiry._id), inquiry);
  }

  const quoteCountsByInquiry = new Map();
  const acceptedQuoteCountsByInquiry = new Map();
  for (const quote of quotes || []) {
    const inquiryId = toId(quote.inquiryId);
    if (!inquiryId) continue;
    quoteCountsByInquiry.set(inquiryId, (quoteCountsByInquiry.get(inquiryId) || 0) + 1);
    if (isAcceptedQuote(quote)) {
      acceptedQuoteCountsByInquiry.set(
        inquiryId,
        (acceptedQuoteCountsByInquiry.get(inquiryId) || 0) + 1
      );
    }
  }

  const hotelRows = (hotels || []).map((hotel) => {
    const hotelId = toId(hotel._id);
    const hotelInquiries = (inquiries || []).filter(
      (inquiry) => toId(inquiry.hotelId) === hotelId
    );
    const inquiryIds = hotelInquiries.map((inquiry) => toId(inquiry._id)).filter(Boolean);
    const inquiryCount = hotelInquiries.length;
    const directInquiryCount = hotelInquiries.filter(
      (inquiry) => inquiry.hotelIntentType === "direct-hotel"
    ).length;
    const itineraryInquiryCount = hotelInquiries.filter(
      (inquiry) => inquiry.hotelIntentType === "itinerary-add-on"
    ).length;
    const quoteCount = inquiryIds.reduce(
      (sum, inquiryId) => sum + (quoteCountsByInquiry.get(inquiryId) || 0),
      0
    );
    const acceptedQuoteCount = inquiryIds.reduce(
      (sum, inquiryId) => sum + (acceptedQuoteCountsByInquiry.get(inquiryId) || 0),
      0
    );
    const latestInquiryAt = hotelInquiries
      .map((inquiry) => new Date(inquiry.createdAt || 0).getTime())
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((left, right) => right - left)[0];

    return {
      hotelId,
      hotelName: hotel.name || "",
      destination: hotel.destination || "",
      sponsoredPlacement: hotel.sponsoredPlacement === true,
      published: hotel.published === true,
      marketplaceVisible: hotel.marketplaceVisible === true,
      inquiryCount,
      directInquiryCount,
      itineraryInquiryCount,
      quoteCount,
      acceptedQuoteCount,
      lastInquiryAt: latestInquiryAt ? new Date(latestInquiryAt).toISOString() : null,
      demandScore:
        inquiryCount * 5 +
        directInquiryCount * 3 +
        acceptedQuoteCount * 8 +
        Number(hotel.sponsoredPlacement === true),
    };
  });

  const summary = {
    totalHotels: (hotels || []).length,
    publicHotels: (hotels || []).filter(
      (hotel) => hotel.published === true && hotel.marketplaceVisible === true
    ).length,
    sponsoredHotels: (hotels || []).filter((hotel) => hotel.sponsoredPlacement === true).length,
    totalHotelLeads: (inquiries || []).filter((inquiry) => toId(inquiry.hotelId)).length,
    directHotelLeads: (inquiries || []).filter(
      (inquiry) => inquiry.hotelIntentType === "direct-hotel"
    ).length,
    itineraryHotelLeads: (inquiries || []).filter(
      (inquiry) => inquiry.hotelIntentType === "itinerary-add-on"
    ).length,
    totalQuotes: (quotes || []).filter((quote) => inquiryMap.has(toId(quote.inquiryId))).length,
    acceptedQuotes: (quotes || []).filter(
      (quote) => inquiryMap.has(toId(quote.inquiryId)) && isAcceptedQuote(quote)
    ).length,
  };

  return {
    summary,
    hotels: hotelRows.sort(
      (left, right) =>
        right.demandScore - left.demandScore ||
        right.inquiryCount - left.inquiryCount ||
        left.hotelName.localeCompare(right.hotelName)
    ),
  };
};
