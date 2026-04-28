import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBookingRevenueUpsert,
  buildPaymentRevenueUpsert,
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
  });

  assert.equal(statement.text.includes("quote_records"), true);
  assert.equal(statement.values[0], "quote-1");
  assert.equal(statement.values[4], "Northern Circuit");
});

test("buildPaymentRevenueUpsert targets payment_records", () => {
  const statement = buildPaymentRevenueUpsert({
    _id: "payment-1",
    tenantId: "tenant-1",
    provider: "stripe",
    amount: 500,
  });

  assert.equal(statement.text.includes("payment_records"), true);
  assert.equal(statement.values[0], "payment-1");
  assert.equal(statement.values[7], "USD");
});
