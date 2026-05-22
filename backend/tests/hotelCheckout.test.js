import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHotelCheckoutQuote,
  buildStayDateKeys,
} from "../utils/hotelCheckout.js";

test("buildStayDateKeys expands nights between check-in and check-out", () => {
  assert.deepEqual(
    buildStayDateKeys({ checkInDate: "2026-07-10", checkOutDate: "2026-07-13" }),
    ["2026-07-10", "2026-07-11", "2026-07-12"]
  );
});

test("buildHotelCheckoutQuote prices availability rows with taxes and deposit", () => {
  const quote = buildHotelCheckoutQuote(
    {
      _id: "hotel-1",
      name: "Arusha Garden Lodge",
      roomInventory: [
        {
          roomTypeCode: "deluxe",
          label: "Deluxe Room",
          capacity: 2,
          baseNightlyRate: 200,
        },
      ],
      availabilityCalendar: [
        { date: "2026-07-10", roomTypeCode: "deluxe", status: "open", availableUnits: 2, nightlyRate: 180 },
        { date: "2026-07-11", roomTypeCode: "deluxe", status: "limited", availableUnits: 1, nightlyRate: 220 },
      ],
      checkoutSettings: {
        currency: "USD",
        taxPercent: 10,
        serviceFeePercent: 5,
        cleaningFee: 20,
        depositPercent: 50,
        allowPayNow: true,
      },
    },
    {
      checkInDate: "2026-07-10",
      checkOutDate: "2026-07-12",
      roomTypeCode: "deluxe",
      units: 1,
      guestCount: 2,
    }
  );

  assert.equal(quote.nights, 2);
  assert.equal(quote.pricing.subtotal, 400);
  assert.equal(quote.pricing.taxes, 40);
  assert.equal(quote.pricing.serviceFee, 20);
  assert.equal(quote.pricing.cleaningFee, 20);
  assert.equal(quote.pricing.total, 480);
  assert.equal(quote.pricing.depositDue, 240);
});
