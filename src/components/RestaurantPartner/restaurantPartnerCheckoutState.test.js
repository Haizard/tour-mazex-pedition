import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCustomDiningPaymentPayload,
  buildDepositPaymentPayload,
  buildRestaurantCheckoutSettingsPayload,
  getRestaurantPaymentStatusLabel,
} from "./restaurantPartnerCheckoutState.js";

test("builds restaurant checkout settings payloads", () => {
  const payload = buildRestaurantCheckoutSettingsPayload({
    enabled: true,
    depositMode: "fixed",
    depositAmount: "50",
    currency: "usd",
  });

  assert.equal(payload.enabled, true);
  assert.equal(payload.depositAmount, 50);
  assert.equal(payload.currency, "USD");
});

test("builds deposit payment request payloads", () => {
  assert.deepEqual(buildDepositPaymentPayload(), { paymentMode: "deposit" });
});

test("builds custom dining payment request payloads", () => {
  const payload = buildCustomDiningPaymentPayload({
    amount: "450",
    currency: "tzs",
    paymentReason: "event_dining",
  });

  assert.equal(payload.paymentMode, "custom");
  assert.equal(payload.amount, 450);
  assert.equal(payload.currency, "TZS");
});

test("formats payment status labels", () => {
  assert.equal(getRestaurantPaymentStatusLabel("payment_requested"), "Payment requested");
  assert.equal(getRestaurantPaymentStatusLabel("paid"), "Paid");
});
