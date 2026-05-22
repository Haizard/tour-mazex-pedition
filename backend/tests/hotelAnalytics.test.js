import test from "node:test";
import assert from "node:assert/strict";

import { buildHotelAnalyticsSnapshot } from "../utils/hotelAnalytics.js";

test("buildHotelAnalyticsSnapshot summarizes hotel visibility, sponsorship, and conversion signals", () => {
  const snapshot = buildHotelAnalyticsSnapshot({
    hotels: [
      {
        _id: "hotel-1",
        name: "Arusha Garden Lodge",
        destination: "Arusha",
        published: true,
        marketplaceVisible: true,
        sponsoredPlacement: true,
      },
      {
        _id: "hotel-2",
        name: "Serengeti Migration Camp",
        destination: "Serengeti",
        published: true,
        marketplaceVisible: true,
        sponsoredPlacement: false,
      },
    ],
    inquiries: [
      {
        _id: "inq-1",
        hotelId: "hotel-1",
        hotelIntentType: "direct-hotel",
        createdAt: "2026-05-20T10:00:00.000Z",
      },
      {
        _id: "inq-2",
        hotelId: "hotel-1",
        hotelIntentType: "itinerary-add-on",
        createdAt: "2026-05-21T10:00:00.000Z",
      },
      {
        _id: "inq-3",
        hotelId: "hotel-2",
        hotelIntentType: "direct-hotel",
        createdAt: "2026-05-22T10:00:00.000Z",
      },
    ],
    quotes: [
      {
        _id: "quote-1",
        inquiryId: "inq-1",
        status: "sent",
        conversionStage: "sent",
      },
      {
        _id: "quote-2",
        inquiryId: "inq-2",
        status: "accepted",
        conversionStage: "accepted",
      },
    ],
  });

  assert.equal(snapshot.summary.totalHotels, 2);
  assert.equal(snapshot.summary.publicHotels, 2);
  assert.equal(snapshot.summary.sponsoredHotels, 1);
  assert.equal(snapshot.summary.totalHotelLeads, 3);
  assert.equal(snapshot.summary.directHotelLeads, 2);
  assert.equal(snapshot.summary.itineraryHotelLeads, 1);
  assert.equal(snapshot.summary.totalQuotes, 2);
  assert.equal(snapshot.summary.acceptedQuotes, 1);
  assert.equal(snapshot.hotels[0].hotelId, "hotel-1");
  assert.equal(snapshot.hotels[0].inquiryCount, 2);
  assert.equal(snapshot.hotels[0].directInquiryCount, 1);
  assert.equal(snapshot.hotels[0].itineraryInquiryCount, 1);
  assert.equal(snapshot.hotels[0].acceptedQuoteCount, 1);
});
