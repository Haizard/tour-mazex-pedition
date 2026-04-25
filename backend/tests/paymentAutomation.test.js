import test from "node:test";
import assert from "node:assert/strict";

import { summarizePaymentTransaction } from "../utils/paymentAutomation.js";

test("summarizePaymentTransaction highlights payable checkout links", () => {
  const result = summarizePaymentTransaction({
    provider: "stripe",
    amount: 2400,
    currency: "USD",
    status: "pending",
    customerName: "Neema Joseph",
  });

  assert.equal(result.badgeLabel, "Pending");
  assert.equal(result.summary.includes("Neema Joseph"), true);
  assert.equal(result.summary.includes("USD 2400"), true);
});

test("summarizePaymentTransaction highlights completed collections", () => {
  const result = summarizePaymentTransaction({
    provider: "paypal",
    amount: 1800,
    currency: "USD",
    status: "paid",
  });

  assert.equal(result.badgeLabel, "Paid");
  assert.equal(result.summary.includes("captured successfully"), true);
});
