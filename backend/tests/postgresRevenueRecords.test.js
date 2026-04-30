import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBookingRevenueDelete,
  buildBookingRevenueUpsert,
  buildPaymentPublicTokenLookup,
  buildPaymentRevenueDelete,
  buildPaymentRevenueUpsert,
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
  assert.equal(statement.text.includes("where public_token = $1"), true);
  assert.deepEqual(statement.values, ["payment-token-1"]);
});
