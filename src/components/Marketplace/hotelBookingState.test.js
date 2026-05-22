import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHotelBookingQuotePayload,
  buildHotelBookingReservationPayload,
  createHotelBookingInitialState,
} from "./hotelBookingState.js";

test("createHotelBookingInitialState returns booking defaults", () => {
  const state = createHotelBookingInitialState();
  assert.equal(state.units, 1);
  assert.equal(state.provider, "stripe");
  assert.equal(state.traveler.email, "");
});

test("buildHotelBookingQuotePayload normalizes numbers", () => {
  const payload = buildHotelBookingQuotePayload({
    checkInDate: "2026-07-10",
    checkOutDate: "2026-07-12",
    roomTypeCode: "suite",
    units: "2",
    guestCount: "4",
  });

  assert.equal(payload.units, 2);
  assert.equal(payload.guestCount, 4);
});

test("buildHotelBookingReservationPayload includes traveler details", () => {
  const payload = buildHotelBookingReservationPayload({
    roomTypeCode: "suite",
    provider: "pesapal",
    traveler: {
      firstName: "Asha",
      lastName: "Mollel",
      email: "asha@example.com",
      phone: "+255700000000",
    },
  });

  assert.equal(payload.provider, "pesapal");
  assert.equal(payload.traveler.firstName, "Asha");
  assert.equal(payload.traveler.email, "asha@example.com");
});
