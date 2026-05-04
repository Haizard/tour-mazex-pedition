import test from "node:test";
import assert from "node:assert/strict";
import { generateQuotePdfBuffer } from "../utils/quotePdfGenerator.js";

test("generateQuotePdfBuffer produces a non-empty buffer", () => {
  const quote = {
    title: "Safari Quote",
    travelerName: "John Doe",
    destinationLabel: "Serengeti",
    tripLengthDays: 5,
    travelerCount: 2,
    summary: "A wonderful safari trip.",
    itineraryOutline: ["Day 1: Arrival", "Day 2: Game drive"],
    lineItems: [{ label: "Safari Package", amount: 2000, notes: "All inclusive" }],
    currency: "USD",
    totalPrice: 2000,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  const buffer = generateQuotePdfBuffer(quote);
  assert.equal(Buffer.isBuffer(buffer), true);
  assert.equal(buffer.length > 1000, true); // PDF should be at least 1KB
});
