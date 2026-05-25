import assert from "node:assert/strict";
import test from "node:test";
import {
  canRequestRestaurantPayment,
  formatRestaurantPaymentAmount,
  summarizeRestaurantReservationPayments,
} from "./restaurantCheckoutAdminState.js";

test("summarizes reservation payments by status", () => {
  const summary = summarizeRestaurantReservationPayments([
    { paymentStatus: "payment_requested" },
    { paymentStatus: "paid" },
    { paymentStatus: "not_required" },
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.paymentRequested, 1);
  assert.equal(summary.paid, 1);
});

test("detects payment request availability", () => {
  assert.equal(canRequestRestaurantPayment({ status: "confirmed", paymentStatus: "not_required" }), true);
  assert.equal(canRequestRestaurantPayment({ status: "pending", paymentStatus: "paid" }), false);
});

test("formats restaurant payment amounts", () => {
  assert.equal(formatRestaurantPaymentAmount({ paymentAmount: 25, paymentCurrency: "usd" }), "USD 25.00");
});
