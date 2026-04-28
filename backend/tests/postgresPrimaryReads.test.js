import test from "node:test";
import assert from "node:assert/strict";

import {
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
