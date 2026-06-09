import test from "node:test";
import assert from "node:assert/strict";

import { buildReservationDepositStatus, formatDepositAmount } from "./restaurantDepositState.js";

test("buildReservationDepositStatus detects pending payment and returns actionable stage", () => {
  const status = buildReservationDepositStatus({
    reservation: { paymentStatus: "pending", paymentAmount: 50, paymentCurrency: "USD" },
    payment: { status: "pending", amount: 50, currency: "USD", publicToken: "tok-1", checkoutUrl: "/payment/tok-1" },
    estimatedDeposit: null,
    checkoutSettings: { enabled: true, depositMode: "fixed", currency: "USD" },
  });

  assert.equal(status.stage, "payment_pending");
  assert.equal(status.publicToken, "tok-1");
  assert.equal(status.actionLabel, "Pay deposit now");
});

test("buildReservationDepositStatus returns paid stage when reservation is paid", () => {
  const status = buildReservationDepositStatus({
    reservation: { paymentStatus: "paid", paymentAmount: 50, paymentCurrency: "USD" },
    payment: null,
    estimatedDeposit: null,
    checkoutSettings: {},
  });

  assert.equal(status.stage, "paid");
  assert.equal(status.label, "Deposit paid");
  assert.equal(status.tone, "success");
});

test("buildReservationDepositStatus returns estimated stage when checkout is enabled and no payment exists", () => {
  const status = buildReservationDepositStatus({
    reservation: { paymentStatus: "not_required" },
    payment: null,
    estimatedDeposit: { amount: 25, currency: "USD" },
    checkoutSettings: { enabled: true, depositMode: "fixed", currency: "USD" },
  });

  assert.equal(status.stage, "estimated");
  assert.equal(status.amount, 25);
});

test("buildReservationDepositStatus returns not_required when no deposit is needed", () => {
  const status = buildReservationDepositStatus({
    reservation: { paymentStatus: "not_required" },
    payment: null,
    estimatedDeposit: null,
    checkoutSettings: { enabled: false },
  });

  assert.equal(status.stage, "not_required");
  assert.equal(status.label, "No deposit required");
});

test("buildReservationDepositStatus defaults to unknown for empty input", () => {
  const status = buildReservationDepositStatus({});
  assert.equal(status.stage, "not_required");
});

test("formatDepositAmount formats USD and TZS currencies", () => {
  assert.equal(formatDepositAmount(1500, "USD"), "USD 1,500");
  assert.equal(formatDepositAmount(50000, "TZS"), "TSh 50,000");
  assert.equal(formatDepositAmount(0, "USD"), "USD 0");
  assert.equal(formatDepositAmount(), "USD 0");
});
