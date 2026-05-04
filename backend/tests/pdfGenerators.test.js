import { generateInvoicePdfBuffer } from "../utils/invoicePdfGenerator.js";
import { generateItineraryPdfBuffer } from "../utils/itineraryPdfGenerator.js";
import assert from "node:assert";
import test from "node:test";

test("Invoice PDF Generator creates a valid buffer", async () => {
  const mockTransaction = {
    _id: "60d5ecb8f1b2c8a1b8e8f8a1",
    customerName: "John Doe",
    amount: 1500,
    currency: "USD",
    status: "paid",
    provider: "stripe",
    paidAt: new Date(),
  };
  const mockBooking = {
    name: "John Doe",
    email: "john@example.com",
    packageTour: "7 Days Luxury Serengeti Safari",
  };

  const buffer = generateInvoicePdfBuffer(mockTransaction, mockBooking);
  
  assert.ok(buffer instanceof Buffer, "Should return a Buffer");
  assert.ok(buffer.length > 0, "Buffer should not be empty");
  // Basic PDF signature check
  assert.strictEqual(buffer.toString("utf8", 0, 4), "%PDF", "Buffer should start with %PDF");
});

test("Itinerary PDF Generator creates a valid buffer", async () => {
  const mockBooking = {
    _id: "60d5ecb8f1b2c8a1b8e8f8a2",
    name: "John Doe",
    email: "john@example.com",
    packageTour: "7 Days Luxury Serengeti Safari",
    travelDate: new Date(),
    pax: 2,
  };
  const mockQuote = {
    itineraryOutline: [
      "Day 1: Arrival in Arusha",
      "Day 2: Tarangire National Park",
      "Day 3: Ngorongoro Crater",
    ],
  };

  const buffer = generateItineraryPdfBuffer(mockBooking, mockQuote);
  
  assert.ok(buffer instanceof Buffer, "Should return a Buffer");
  assert.ok(buffer.length > 0, "Buffer should not be empty");
  assert.strictEqual(buffer.toString("utf8", 0, 4), "%PDF", "Buffer should start with %PDF");
});
