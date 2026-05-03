import test from "node:test";
import assert from "node:assert/strict";

import { buildRepeatCustomerAutomation } from "../utils/repeatCustomerAutomation.js";

test("buildRepeatCustomerAutomation creates a referral-style repeat customer draft", () => {
  const result = buildRepeatCustomerAutomation({
    booking: {
      _id: "booking-1",
      name: "Asha Musa",
      email: "asha@example.com",
      packageTour: "Serengeti Fly-In Safari",
      travelDate: "2026-07-14T00:00:00.000Z",
      totalPrice: 4200,
      status: "Confirmed",
    },
    bookingHistory: [
      { _id: "booking-1", totalPrice: 4200 },
    ],
    tenantName: "Makolo Afrika",
  });

  assert.equal(result.status, "draft");
  assert.equal(result.campaignType, "referral");
  assert.equal(result.subject.includes("Makolo Afrika"), true);
  assert.equal(result.message.includes("Serengeti Fly-In Safari"), true);
  assert.equal(result.offerLabel.length > 0, true);
});

test("buildRepeatCustomerAutomation upgrades repeat guests into anniversary return offers", () => {
  const result = buildRepeatCustomerAutomation({
    booking: {
      _id: "booking-2",
      name: "John Doe",
      email: "john@example.com",
      packageTour: "Custom Tanzania Journey",
      travelDate: "2026-02-10T00:00:00.000Z",
      totalPrice: 1800,
      status: "Confirmed",
    },
    bookingHistory: [
      { _id: "old-1", totalPrice: 2200 },
      { _id: "booking-2", totalPrice: 1800 },
    ],
    tenantName: "Nomad Trails",
  });

  assert.equal(result.campaignType, "anniversary");
  assert.equal(result.audienceTag, "repeat-guest");
  assert.equal(result.nextStepChecklist.length > 0, true);
});
