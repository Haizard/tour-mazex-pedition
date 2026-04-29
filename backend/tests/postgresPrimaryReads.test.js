import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizePrimaryAccommodationRows,
  normalizePrimaryAirportPickupRows,
  normalizePrimaryGuideDriverRows,
  normalizePrimaryInquiryRows,
  normalizePrimaryPaymentRows,
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
