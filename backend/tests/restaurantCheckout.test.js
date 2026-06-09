import assert from "node:assert/strict";
import test from "node:test";
import {
  autoCreateRestaurantDepositPayment,
  buildReservationPaymentUpdate,
  buildRestaurantPaymentTransactionPayload,
  calculateRestaurantDepositAmount,
  isActiveRestaurantPaymentTransaction,
  normalizeRestaurantCheckoutSettings,
  validateCustomRestaurantPayment,
} from "../utils/restaurantCheckout.js";

test("normalizes restaurant checkout settings with safe defaults", () => {
  const settings = normalizeRestaurantCheckoutSettings({});

  assert.equal(settings.enabled, false);
  assert.equal(settings.depositMode, "none");
  assert.equal(settings.currency, "USD");
});

test("calculates fixed restaurant deposits", () => {
  const amount = calculateRestaurantDepositAmount({
    settings: { enabled: true, depositMode: "fixed", depositAmount: 25, currency: "usd" },
    reservation: { guestCount: 4 },
  });

  assert.equal(amount.amount, 25);
  assert.equal(amount.currency, "USD");
});

test("calculates percentage restaurant deposits from estimated total", () => {
  const amount = calculateRestaurantDepositAmount({
    settings: { enabled: true, depositMode: "percentage", depositPercentage: 20 },
    reservation: { estimatedTotal: 300 },
  });

  assert.equal(amount.amount, 60);
});

test("validates custom restaurant payment amounts", () => {
  const result = validateCustomRestaurantPayment({
    amount: 450,
    currency: "tzs",
    paymentReason: "event_dining",
  });

  assert.equal(result.amount, 450);
  assert.equal(result.currency, "TZS");
  assert.equal(result.paymentReason, "event_dining");
});

test("detects active restaurant payment transactions", () => {
  assert.equal(isActiveRestaurantPaymentTransaction({ status: "pending" }), true);
  assert.equal(isActiveRestaurantPaymentTransaction({ status: "paid" }), false);
  assert.equal(isActiveRestaurantPaymentTransaction(null), false);
});

test("builds restaurant payment transaction payload with reservation metadata", () => {
  const payload = buildRestaurantPaymentTransactionPayload({
    tenantId: "tenant-1",
    restaurant: { _id: "restaurant-1", name: "River Table" },
    reservation: {
      _id: "reservation-1",
      serviceWindowId: "service-1",
      tableTypeId: "table-1",
      source: "direct",
      travelerName: "Asha",
    },
    payment: {
      amount: 80,
      currency: "USD",
      paymentReason: "reservation_deposit",
      paymentInstructions: "Deposit confirms the table request.",
    },
  });

  assert.equal(payload.tenantId, "tenant-1");
  assert.equal(payload.restaurantId, "restaurant-1");
  assert.equal(payload.restaurantReservationRequestId, "reservation-1");
  assert.equal(payload.sourceType, "restaurant_reservation");
  assert.equal(payload.amount, 80);
  assert.equal(payload.checkoutKind, "restaurant_reservation");
});

test("builds reservation payment update payloads", () => {
  const update = buildReservationPaymentUpdate({
    transaction: { _id: "payment-1", amount: 80, currency: "USD" },
    paymentReason: "reservation_deposit",
    paymentInstructions: "Pay deposit",
  });

  assert.equal(update.paymentStatus, "payment_requested");
  assert.equal(update.paymentTransactionId, "payment-1");
  assert.equal(update.paymentAmount, 80);
  assert.equal(update.paymentReason, "reservation_deposit");
});

test("autoCreateRestaurantDepositPayment skips when autoDeposit is not enabled", async () => {
  const result = await autoCreateRestaurantDepositPayment({
    tenantId: "tenant-1",
    restaurant: {
      _id: "restaurant-1",
      name: "River Table",
      restaurantCheckout: { enabled: true, depositMode: "fixed", depositAmount: 25, autoDeposit: false },
    },
    reservation: { _id: "reservation-1", paymentStatus: "not_required", estimatedTotal: 100 },
  });

  assert.equal(result.created, false);
  assert.equal(result.skipped, true);
});

test("autoCreateRestaurantDepositPayment skips when reservation already has payment", async () => {
  const result = await autoCreateRestaurantDepositPayment({
    tenantId: "tenant-1",
    restaurant: {
      _id: "restaurant-1",
      name: "River Table",
      restaurantCheckout: { enabled: true, depositMode: "fixed", depositAmount: 25, autoDeposit: true },
    },
    reservation: { _id: "reservation-1", paymentStatus: "payment_requested", estimatedTotal: 100 },
  });

  assert.equal(result.created, false);
  assert.equal(result.skipped, true);
});

test("autoCreateRestaurantDepositPayment returns error for disabled checkout", async () => {
  const result = await autoCreateRestaurantDepositPayment({
    tenantId: "tenant-1",
    restaurant: {
      _id: "restaurant-1",
      name: "River Table",
      restaurantCheckout: { enabled: false, depositMode: "none", autoDeposit: true },
    },
    reservation: { _id: "reservation-1", paymentStatus: "not_required" },
  });

  assert.equal(result.created, false);
  assert.equal(result.skipped, true);
});
