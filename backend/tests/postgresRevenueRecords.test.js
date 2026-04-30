import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBookingRevenueLookup,
  buildBookingRevenueDelete,
  buildBookingRevenueView,
  buildPaymentRevenueLookup,
  buildBookingRevenueUpsert,
  buildPaymentRevenueView,
  buildPaymentProviderReferenceLookup,
  buildPaymentPublicTokenLookup,
  buildPaymentRevenueDelete,
  buildPaymentRevenueUpsert,
  buildPublicPaymentRevenueView,
  buildPublicQuoteRevenueView,
  buildQuotePublicTokenLookup,
  buildQuoteRevenueDelete,
  buildQuoteRevenueUpsert,
} from "../utils/postgresRevenueRecords.js";

test("buildBookingRevenueUpsert targets booking_records", () => {
  const statement = buildBookingRevenueUpsert({
    _id: "booking-1",
    tenantId: "tenant-1",
    name: "Amina",
    totalPrice: 3200,
  });

  assert.equal(statement.text.includes("booking_records"), true);
  assert.equal(statement.values[0], "booking-1");
  assert.equal(statement.values[3], "Amina");
});

test("buildQuoteRevenueUpsert targets quote_records", () => {
  const statement = buildQuoteRevenueUpsert({
    _id: "quote-1",
    tenantId: "tenant-1",
    inquiryId: "inquiry-1",
    title: "Northern Circuit",
    publicToken: "quote-public-token",
  });

  assert.equal(statement.text.includes("quote_records"), true);
  assert.equal(statement.values[0], "quote-1");
  assert.equal(statement.values[4], "Northern Circuit");
  assert.equal(statement.values[11], "quote-public-token");
});

test("buildPaymentRevenueUpsert targets payment_records", () => {
  const statement = buildPaymentRevenueUpsert({
    _id: "payment-1",
    tenantId: "tenant-1",
    provider: "stripe",
    amount: 500,
    publicToken: "payment-public-token",
  });

  assert.equal(statement.text.includes("payment_records"), true);
  assert.equal(statement.values[0], "payment-1");
  assert.equal(statement.values[4], "payment-public-token");
  assert.equal(statement.values[8], "USD");
});

test("buildBookingRevenueDelete targets booking_records", () => {
  const statement = buildBookingRevenueDelete({
    sourceId: "booking-1",
    tenantId: "tenant-1",
  });

  assert.equal(statement.text.includes("booking_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["booking-1", "tenant-1"]);
});

test("buildQuoteRevenueDelete targets quote_records", () => {
  const statement = buildQuoteRevenueDelete({
    sourceId: "quote-1",
    tenantId: "tenant-1",
  });

  assert.equal(statement.text.includes("quote_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["quote-1", "tenant-1"]);
});

test("buildQuotePublicTokenLookup targets the public token in quote_records", () => {
  const statement = buildQuotePublicTokenLookup({
    publicToken: "quote-token-1",
  });

  assert.equal(statement.text.includes("quote_records"), true);
  assert.equal(statement.text.includes("where public_token = $1"), true);
  assert.deepEqual(statement.values, ["quote-token-1"]);
});

test("buildBookingRevenueLookup targets booking_records by source and tenant", () => {
  const statement = buildBookingRevenueLookup({
    sourceId: "booking-1",
    tenantId: "tenant-1",
  });

  assert.equal(statement.text.includes("from public.booking_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["booking-1", "tenant-1"]);
});

test("buildPaymentRevenueDelete targets payment_records", () => {
  const statement = buildPaymentRevenueDelete({
    sourceId: "payment-1",
    tenantId: "tenant-1",
  });

  assert.equal(statement.text.includes("payment_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["payment-1", "tenant-1"]);
});

test("buildPaymentPublicTokenLookup targets the public token in payment_records", () => {
  const statement = buildPaymentPublicTokenLookup({
    publicToken: "payment-token-1",
  });

  assert.equal(statement.text.includes("payment_records"), true);
  assert.equal(statement.text.includes("where pr.public_token = $1"), true);
  assert.deepEqual(statement.values, ["payment-token-1"]);
});

test("buildPaymentRevenueLookup targets payment_records by source and tenant", () => {
  const statement = buildPaymentRevenueLookup({
    sourceId: "payment-1",
    tenantId: "tenant-1",
  });

  assert.equal(statement.text.includes("from public.payment_records pr"), true);
  assert.equal(statement.text.includes("where pr.source_id = $1 and pr.tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["payment-1", "tenant-1"]);
});

test("buildPaymentProviderReferenceLookup targets provider references in payment_records", () => {
  const statement = buildPaymentProviderReferenceLookup({
    provider: "stripe",
    providerReference: "pi_123",
  });

  assert.equal(statement.text.includes("payment_records"), true);
  assert.equal(statement.text.includes("where pr.provider = $1"), true);
  assert.equal(statement.text.includes("and pr.provider_reference = $2"), true);
  assert.deepEqual(statement.values, ["stripe", "pi_123"]);
});

test("buildPublicQuoteRevenueView reconstructs the public quote payload from postgres", () => {
  const quote = buildPublicQuoteRevenueView({
    source_id: "quote-1",
    tenant_id: "tenant-1",
    inquiry_id: "inquiry-1",
    booking_id: "booking-1",
    title: "Northern Circuit Escape",
    traveler_name: "Amina",
    status: "accepted",
    conversion_stage: "accepted",
    payment_status: "pending",
    currency: "USD",
    total_price: 4200,
    public_token: "quote-token-1",
    valid_until: "2026-05-15T00:00:00.000Z",
    sent_at: "2026-04-28T08:00:00.000Z",
    accepted_at: "2026-04-29T09:00:00.000Z",
    source_payload: {
      summary: "A private safari through the north.",
      travelerCount: 2,
      tripLengthDays: 6,
      itineraryOutline: ["Day 1", "Day 2"],
      nextSteps: ["Approve the quote"],
      lineItems: [{ label: "Safari", amount: 4200 }],
    },
  });

  assert.equal(quote._id, "quote-1");
  assert.equal(quote.title, "Northern Circuit Escape");
  assert.equal(quote.publicToken, "quote-token-1");
  assert.equal(quote.totalPrice, 4200);
  assert.equal(quote.travelerCount, 2);
  assert.deepEqual(quote.itineraryOutline, ["Day 1", "Day 2"]);
  assert.equal(quote.validUntil, "2026-05-15T00:00:00.000Z");
});

test("buildPublicPaymentRevenueView reconstructs the public payment payload from postgres", () => {
  const payment = buildPublicPaymentRevenueView({
    source_id: "payment-1",
    booking_id: "booking-1",
    provider: "stripe",
    public_token: "payment-token-1",
    provider_reference: "pi_123",
    customer_name: "Amina",
    status: "pending",
    currency: "USD",
    amount: 650,
    fee_percent: 5,
    fee_amount: 32.5,
    failure_reason: "",
    updated_at: "2026-04-30T10:00:00.000Z",
    booking_name: "Amina",
    booking_package_tour: "Serengeti Explorer",
    source_payload: {
      checkoutUrl: "https://example.com/pay",
      notes: "Deposit due today",
    },
  });

  assert.equal(payment._id, "payment-1");
  assert.equal(payment.publicToken, "payment-token-1");
  assert.equal(payment.provider, "stripe");
  assert.equal(payment.amount, 650);
  assert.equal(payment.bookingId.packageTour, "Serengeti Explorer");
  assert.equal(payment.notes, "Deposit due today");
  assert.equal(payment.lifecycle.status, "pending");
  assert.equal(payment.paymentSummary.summary, "STRIPE USD 650 pending");
});

test("buildBookingRevenueView reconstructs the admin booking payload from postgres", () => {
  const booking = buildBookingRevenueView({
    source_id: "booking-1",
    tenant_id: "tenant-1",
    quote_proposal_id: "quote-1",
    traveler_name: "Amina Said",
    email: "amina@example.com",
    phone: "+255700000000",
    package_tour: "Serengeti Explorer",
    status: "Confirmed",
    revenue_stage: "awaiting-payment",
    payment_status: "pending",
    total_price: 4200,
    currency: "USD",
    referral_code: "REF123",
    lead_source: "partner-referral",
    campaign_label: "April push",
    first_touch_at: "2026-04-29T09:00:00.000Z",
    converted_at: null,
    travel_date: "2026-08-01T00:00:00.000Z",
    created_at: "2026-04-28T09:00:00.000Z",
    updated_at: "2026-04-30T10:00:00.000Z",
    source_payload: {
      address: "Arusha",
      pax: 3,
      adults: 2,
      children: 1,
      notes: "Window seats please",
    },
  });

  assert.equal(booking._id, "booking-1");
  assert.equal(booking.name, "Amina Said");
  assert.equal(booking.packageTour, "Serengeti Explorer");
  assert.equal(booking.paymentStatus, "pending");
  assert.equal(booking.pax, 3);
  assert.equal(booking.notes, "Window seats please");
});

test("buildPaymentRevenueView reconstructs the admin payment payload from postgres", () => {
  const payment = buildPaymentRevenueView({
    source_id: "payment-1",
    booking_id: "booking-1",
    provider: "stripe",
    provider_reference: "pi_123",
    customer_name: "Amina",
    status: "paid",
    currency: "USD",
    amount: 650,
    fee_percent: 5,
    fee_amount: 32.5,
    failure_reason: "",
    paid_at: "2026-04-30T10:00:00.000Z",
    updated_at: "2026-04-30T10:00:00.000Z",
    booking_name: "Amina",
    booking_revenue_stage: "paid",
    booking_payment_status: "paid",
    source_payload: {
      checkoutUrl: "https://example.com/pay",
      notes: "Deposit settled",
    },
  });

  assert.equal(payment._id, "payment-1");
  assert.equal(payment.bookingId.name, "Amina");
  assert.equal(payment.bookingId.paymentStatus, "paid");
  assert.equal(payment.checkoutUrl, "https://example.com/pay");
  assert.equal(payment.lifecycle.paidAt, "2026-04-30T10:00:00.000Z");
});
