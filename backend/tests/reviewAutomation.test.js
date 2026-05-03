import test from "node:test";
import assert from "node:assert/strict";

import { buildReviewRequestDraft } from "../utils/reviewAutomation.js";

test("buildReviewRequestDraft creates a guest-ready review follow-up for confirmed bookings", () => {
  const result = buildReviewRequestDraft({
    booking: {
      _id: "booking-1",
      name: "Asha Musa",
      email: "asha@example.com",
      packageTour: "Serengeti Fly-In Safari",
      travelDate: "2026-07-14T00:00:00.000Z",
      totalPrice: 4200,
      status: "Confirmed",
    },
    tenantName: "Makolo Afrika",
  });

  assert.equal(result.guestName, "Asha Musa");
  assert.equal(result.status, "draft");
  assert.equal(result.platforms.length >= 2, true);
  assert.equal(result.message.includes("Serengeti Fly-In Safari"), true);
  assert.equal(result.subject.includes("Makolo Afrika"), true);
});

test("buildReviewRequestDraft falls back to a safe generic summary without a travel date", () => {
  const result = buildReviewRequestDraft({
    booking: {
      name: "John Doe",
      email: "john@example.com",
      packageTour: "Custom Tanzania Journey",
      totalPrice: 1800,
      status: "Confirmed",
    },
    tenantName: "Nomad Trails",
  });

  assert.equal(result.sendWindowLabel, "within 3 days of trip completion");
  assert.equal(result.nextStepChecklist.length > 0, true);
  assert.equal(result.platforms.some((item) => item.channel === "google"), true);
});
