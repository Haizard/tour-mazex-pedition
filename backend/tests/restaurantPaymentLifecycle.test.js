import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRestaurantReservationPaymentPatch,
  shouldSyncRestaurantReservationPayment,
  syncRestaurantReservationPaymentState,
} from "../utils/restaurantPaymentLifecycle.js";

test("builds paid reservation payment patch from a payment transaction", () => {
  const patch = buildRestaurantReservationPaymentPatch({
    _id: "payment-1",
    status: "paid",
    amount: 80,
    currency: "usd",
    paidAt: "2026-06-10T10:00:00.000Z",
  });

  assert.equal(patch.paymentStatus, "paid");
  assert.equal(patch.paymentTransactionId, "payment-1");
  assert.equal(patch.paymentAmount, 80);
  assert.equal(patch.paymentCurrency, "USD");
  assert.equal(patch.paymentPaidAt.toISOString(), "2026-06-10T10:00:00.000Z");
});

test("maps failed, cancelled, and refunded payment statuses", () => {
  assert.equal(buildRestaurantReservationPaymentPatch({ status: "failed" }).paymentStatus, "failed");
  assert.equal(buildRestaurantReservationPaymentPatch({ status: "cancelled" }).paymentStatus, "failed");
  assert.equal(buildRestaurantReservationPaymentPatch({ status: "refunded" }).paymentStatus, "refunded");
});

test("detects restaurant reservation linked payments", () => {
  assert.equal(
    shouldSyncRestaurantReservationPayment({ restaurantReservationRequestId: "reservation-1" }),
    true
  );
  assert.equal(shouldSyncRestaurantReservationPayment({}), false);
});

test("syncs restaurant reservation payment state through injected updater", async () => {
  let receivedPatch = null;
  const result = await syncRestaurantReservationPaymentState(
    {
      _id: "payment-1",
      restaurantReservationRequestId: "reservation-1",
      status: "paid",
      amount: 80,
      currency: "USD",
    },
    {
      updateReservation: async ({ reservationId, patch }) => {
        assert.equal(reservationId, "reservation-1");
        receivedPatch = patch;
        return { _id: reservationId, ...patch };
      },
    }
  );

  assert.equal(result.synced, true);
  assert.equal(receivedPatch.paymentStatus, "paid");
});
