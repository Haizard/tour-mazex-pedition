import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPrimaryGuideDriverTeam,
  normalizePrimaryAccommodationRows,
  normalizePrimaryAirportPickupRows,
  normalizePrimaryBookingRows,
  normalizePrimaryCompetitorRows,
  normalizePrimaryGuideDriverRows,
  normalizePrimaryInquiryRows,
  normalizePrimaryLanguageAssistantRows,
  normalizePrimaryPartnerRows,
  normalizePrimaryPaymentRows,
  normalizePrimaryRepeatCustomerCampaignRows,
  normalizePrimaryReviewRequestRows,
  normalizePrimaryTravelDocumentationRows,
} from "../utils/postgresPrimaryReads.js";

test("normalizePrimaryPaymentRows rebuilds payment admin records from postgres rows", () => {
  const rows = normalizePrimaryPaymentRows([
    {
      source_id: "payment-1",
      booking_id: "booking-1",
      provider: "stripe",
      provider_reference: "pi_123",
      customer_name: "Amina",
      status: "paid",
      currency: "USD",
      amount: "500.00",
      fee_percent: "2.9",
      fee_amount: "14.5",
      failure_reason: "",
      paid_at: "2026-04-28T10:00:00.000Z",
      refunded_at: null,
      cancelled_at: null,
      source_payload: {
        checkoutUrl: "https://checkout.example",
        notes: "Priority traveler",
      },
      booking_name: "Serengeti Gold",
      booking_revenue_stage: "paid",
      booking_payment_status: "paid",
    },
  ]);

  assert.equal(rows[0]._id, "payment-1");
  assert.equal(rows[0].bookingId._id, "booking-1");
  assert.equal(rows[0].bookingId.name, "Serengeti Gold");
  assert.equal(rows[0].checkoutUrl, "https://checkout.example");
  assert.equal(rows[0].paymentSummary.summary.includes("USD 500"), true);
});

test("normalizePrimaryInquiryRows rebuilds lead inbox records from postgres rows", () => {
  const rows = normalizePrimaryInquiryRows([
    {
      source_id: "inquiry-1",
      tenant_id: "tenant-1",
      traveler_name: "Amina Said",
      first_name: "Amina",
      last_name: "Said",
      email: "amina@example.com",
      phone: "+255700",
      destinations: ["Serengeti", "Ngorongoro"],
      travel_when: "July 2026",
      budget: "$4000",
      lead_stage: "qualified",
      status: "Contacted",
      source_channel: "website",
      campaign_label: "Summer push",
      referral_code: "REF123",
      lead_score: "91",
      lead_temperature: "hot",
      source_payload: {
        message: "Need a premium safari.",
        contactPreference: "whatsapp",
        followUpMessage: "We have a great itinerary ready.",
        automationSummary: "High intent lead",
      },
    },
  ]);

  assert.equal(rows[0]._id, "inquiry-1");
  assert.equal(rows[0].name, "Amina Said");
  assert.equal(rows[0].contactPreference, "whatsapp");
  assert.equal(rows[0].followUpMessage, "We have a great itinerary ready.");
  assert.deepEqual(rows[0].destinations, ["Serengeti", "Ngorongoro"]);
});

test("normalizePrimaryGuideDriverRows rebuilds operations team rows from postgres rows", () => {
  const rows = normalizePrimaryGuideDriverRows([
    {
      source_id: "staff-1",
      tenant_id: "tenant-1",
      assigned_booking_id: "booking-1",
      staff_type: "guide",
      full_name: "Neema Joseph",
      phone: "+2557001",
      email: "neema@example.com",
      home_base: "Arusha",
      availability_status: "assigned",
      languages: ["English", "Swahili"],
      specialties: ["Wildlife", "Photography"],
      assigned_tour_title: "Northern Circuit",
      assignment_date: "2026-05-10T00:00:00.000Z",
      assignment_start_date: "2026-05-10T00:00:00.000Z",
      assignment_end_date: "2026-05-12T00:00:00.000Z",
      assignment_notes: "VIP travelers",
      license_category: "",
    },
  ]);

  assert.equal(rows[0]._id, "staff-1");
  assert.equal(rows[0].assignedBookingId, "booking-1");
  assert.equal(rows[0].fullName, "Neema Joseph");
  assert.deepEqual(rows[0].languages, ["English", "Swahili"]);
  assert.equal(rows[0].assignmentNotes, "VIP travelers");
});

test("normalizePrimaryAccommodationRows rebuilds accommodation rows from postgres rows", () => {
  const rows = normalizePrimaryAccommodationRows([
    {
      source_id: "reservation-1",
      tenant_id: "tenant-1",
      booking_id: "booking-1",
      booking_guest_name: "Amina Said",
      hotel_name: "Serena Lodge",
      supplier_name: "Serena",
      supplier_contact: "ops@serena.example",
      destination: "Serengeti",
      reservation_code: "SR-100",
      room_plan: "Double",
      check_in_date: "2026-07-01T00:00:00.000Z",
      check_out_date: "2026-07-03T00:00:00.000Z",
      guest_count: "2",
      status: "confirmed",
      notes: "Late arrival",
      assigned_tour_title: "Migration Escape",
    },
  ]);

  assert.equal(rows[0]._id, "reservation-1");
  assert.equal(rows[0].hotelName, "Serena Lodge");
  assert.equal(rows[0].bookingGuestName, "Amina Said");
  assert.equal(rows[0].guestCount, 2);
  assert.equal(rows[0].assignedTourTitle, "Migration Escape");
});

test("normalizePrimaryAirportPickupRows rebuilds pickup rows from postgres rows", () => {
  const rows = normalizePrimaryAirportPickupRows([
    {
      source_id: "pickup-1",
      tenant_id: "tenant-1",
      booking_id: "booking-1",
      driver_id: "driver-1",
      guest_name: "Amina Said",
      airport_code: "JRO",
      flight_number: "KQ 482",
      pickup_date_time: "2026-07-01T08:30:00.000Z",
      destination_label: "Arusha Coffee Lodge",
      assigned_tour_title: "Migration Escape",
      driver_name: "Baraka",
      vehicle_label: "Land Cruiser",
      guest_count: "2",
      status: "scheduled",
      notes: "Meet at arrivals",
    },
  ]);

  assert.equal(rows[0]._id, "pickup-1");
  assert.equal(rows[0].driverId, "driver-1");
  assert.equal(rows[0].airportCode, "JRO");
  assert.equal(rows[0].guestCount, 2);
  assert.equal(rows[0].vehicleLabel, "Land Cruiser");
});

test("normalizePrimaryPartnerRows rebuilds partner list rows from postgres rows", () => {
  const rows = normalizePrimaryPartnerRows([
    {
      source_id: "partner-1",
      tenant_id: "tenant-1",
      partner_type: "agency",
      company_name: "Safari Allies",
      contact_name: "Amina",
      email: "amina@safari-allies.example",
      phone: "+2557002",
      location: "Arusha",
      service_focus: "Luxury",
      contract_label: "Gold",
      payout_terms: "Net 30",
      notes: "Preferred partner",
      status: "active",
    },
  ]);

  assert.equal(rows[0]._id, "partner-1");
  assert.equal(rows[0].companyName, "Safari Allies");
  assert.equal(rows[0].partnerType, "agency");
  assert.equal(rows[0].status, "active");
});

test("normalizePrimaryCompetitorRows rebuilds competitor list rows from postgres rows", () => {
  const rows = normalizePrimaryCompetitorRows([
    {
      source_id: "insight-1",
      tenant_id: "tenant-1",
      competitor_name: "Safari Rival",
      market_region: "East Africa",
      focus_route: "Serengeti",
      observed_price_usd: "4200",
      currency: "USD",
      market_trend: "Rising demand",
      offer_summary: "Migration package",
      source_label: "Meta ad",
      intelligence_date: "2026-04-29T00:00:00.000Z",
      strength_signals: ["Speed", "Packaging"],
      risk_signals: ["Discounting"],
      status: "active",
      notes: "Watch pricing",
    },
  ]);

  assert.equal(rows[0]._id, "insight-1");
  assert.equal(rows[0].competitorName, "Safari Rival");
  assert.equal(rows[0].observedPriceUsd, 4200);
  assert.deepEqual(rows[0].strengthSignals, ["Speed", "Packaging"]);
});

test("normalizePrimaryLanguageAssistantRows rebuilds language pack rows from postgres rows", () => {
  const rows = normalizePrimaryLanguageAssistantRows([
    {
      source_id: "lang-1",
      tenant_id: "tenant-1",
      language: "French",
      locale_code: "fr-FR",
      tone: "Warm",
      use_cases: ["Sales", "Support"],
      glossary: ["Safari", "Transfer"],
      status: "active",
      notes: "Priority pack",
    },
  ]);

  assert.equal(rows[0]._id, "lang-1");
  assert.equal(rows[0].language, "French");
  assert.deepEqual(rows[0].useCases, ["Sales", "Support"]);
  assert.equal(rows[0].status, "active");
});

test("normalizePrimaryTravelDocumentationRows rebuilds travel guide rows from postgres rows", () => {
  const rows = normalizePrimaryTravelDocumentationRows([
    {
      source_id: "doc-1",
      tenant_id: "tenant-1",
      market: "USA",
      topic: "Visa",
      requirement_summary: "Apply before travel",
      source_label: "Embassy",
      last_reviewed_at: "2026-04-29T00:00:00.000Z",
      status: "active",
      notes: "Updated this week",
    },
  ]);

  assert.equal(rows[0]._id, "doc-1");
  assert.equal(rows[0].market, "USA");
  assert.equal(rows[0].topic, "Visa");
  assert.equal(rows[0].status, "active");
});

test("normalizePrimaryReviewRequestRows rebuilds review automation rows from postgres rows", () => {
  const rows = normalizePrimaryReviewRequestRows([
    {
      source_id: "review-1",
      tenant_id: "tenant-1",
      booking_id: "booking-1",
      guest_name: "Amina Said",
      guest_email: "amina@example.com",
      booking_label: "Migration Escape",
      subject: "Please review us",
      message: "We would love your feedback",
      status: "sent",
      platforms: [{ channel: "google", label: "Google Reviews", reviewUrl: "https://google.example" }],
      send_window_label: "3 days after trip",
      next_step_checklist: ["Add links", "Send"],
      sent_at: "2026-04-28T10:00:00.000Z",
      completed_at: null,
    },
  ]);

  assert.equal(rows[0]._id, "review-1");
  assert.equal(rows[0].bookingId, "booking-1");
  assert.equal(rows[0].guestName, "Amina Said");
  assert.equal(rows[0].platforms[0].channel, "google");
  assert.equal(rows[0].sentAt, "2026-04-28T10:00:00.000Z");
});

test("normalizePrimaryRepeatCustomerCampaignRows rebuilds loyalty campaign rows from postgres rows", () => {
  const rows = normalizePrimaryRepeatCustomerCampaignRows([
    {
      source_id: "campaign-1",
      tenant_id: "tenant-1",
      booking_id: "booking-1",
      guest_name: "Amina Said",
      guest_email: "amina@example.com",
      booking_label: "Migration Escape",
      campaign_type: "anniversary",
      audience_tag: "vip",
      segment: "VIP",
      channel: "whatsapp",
      offer_label: "VIP Loyalty Recognition",
      subject: "Exclusive VIP Invitation",
      message: "We would love to host you again",
      status: "sent",
      recommended_send_at_label: "post-trip",
      next_step_checklist: ["Confirm channel"],
      sent_at: "2026-04-29T10:00:00.000Z",
      converted_at: null,
    },
  ]);

  assert.equal(rows[0]._id, "campaign-1");
  assert.equal(rows[0].campaignType, "anniversary");
  assert.equal(rows[0].segment, "VIP");
  assert.equal(rows[0].channel, "whatsapp");
  assert.equal(rows[0].nextStepChecklist[0], "Confirm channel");
});

test("normalizePrimaryBookingRows rebuilds booking admin rows from postgres rows", () => {
  const rows = normalizePrimaryBookingRows([
    {
      source_id: "booking-1",
      tenant_id: "tenant-1",
      quote_proposal_id: "quote-1",
      traveler_name: "Amina Said",
      email: "amina@example.com",
      phone: "+2557000",
      package_tour: "Migration Escape",
      status: "Confirmed",
      revenue_stage: "awaiting-payment",
      payment_status: "pending",
      total_price: "5400",
      currency: "USD",
      referral_code: "REF-20",
      lead_source: "partner-referral",
      campaign_label: "Peak season",
      first_touch_at: "2026-04-20T12:00:00.000Z",
      converted_at: null,
      travel_date: "2026-07-11T00:00:00.000Z",
      source_payload: {
        address: "Arusha",
        pax: 2,
        adults: 2,
        children: 0,
        notes: "Window seats preferred",
        date: "2026-04-18T09:00:00.000Z",
        createdAt: "2026-04-18T09:00:00.000Z",
        updatedAt: "2026-04-28T11:00:00.000Z",
      },
      updated_at: "2026-04-28T11:00:00.000Z",
      created_at: "2026-04-18T09:00:00.000Z",
    },
  ]);

  assert.equal(rows[0]._id, "booking-1");
  assert.equal(rows[0].name, "Amina Said");
  assert.equal(rows[0].packageTour, "Migration Escape");
  assert.equal(rows[0].status, "Confirmed");
  assert.equal(rows[0].paymentStatus, "pending");
  assert.equal(rows[0].revenueStage, "awaiting-payment");
  assert.equal(rows[0].totalPrice, 5400);
  assert.equal(rows[0].address, "Arusha");
  assert.equal(rows[0].quoteProposalId, "quote-1");
  assert.equal(rows[0].travelDate, "2026-07-11T00:00:00.000Z");
  assert.equal(rows[0].createdAt, "2026-04-18T09:00:00.000Z");
});

test("buildPrimaryGuideDriverTeam preserves notification readiness on dashboard team rows", () => {
  const team = buildPrimaryGuideDriverTeam([
    {
      _id: "staff-1",
      availabilityStatus: "assigned",
      assignedBookingId: "booking-1",
      assignedTourTitle: "Northern Circuit",
      staffType: "guide",
      fullName: "Neema Joseph",
    },
    {
      _id: "staff-2",
      availabilityStatus: "available",
      assignedBookingId: "",
      staffType: "driver",
      fullName: "Baraka",
    },
  ]);

  assert.equal(team[0].notificationReady, true);
  assert.equal(team[0].assignmentSummary?.summary.includes("Northern Circuit"), true);
  assert.equal(team[1].notificationReady, false);
});

test("normalizePrimary rows tolerate invalid timestamps by returning nulls", () => {
  const guideRows = normalizePrimaryGuideDriverRows([
    {
      source_id: "staff-1",
      assignment_start_date: "not-a-date",
      assignment_end_date: "still-bad",
      assignment_date: "broken",
    },
  ]);
  const accommodationRows = normalizePrimaryAccommodationRows([
    {
      source_id: "stay-1",
      check_in_date: "bad-date",
      check_out_date: "bad-date",
    },
  ]);
  const airportRows = normalizePrimaryAirportPickupRows([
    {
      source_id: "pickup-1",
      pickup_date_time: "bad-date",
      source_payload: { lastDriverBriefSharedAt: "broken" },
    },
  ]);

  assert.equal(guideRows[0].assignmentStartDate, null);
  assert.equal(guideRows[0].assignmentEndDate, null);
  assert.equal(accommodationRows[0].checkInDate, null);
  assert.equal(accommodationRows[0].checkOutDate, null);
  assert.equal(airportRows[0].pickupDateTime, null);
});
