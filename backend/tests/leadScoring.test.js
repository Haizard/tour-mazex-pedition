import test from "node:test";
import assert from "node:assert/strict";

import { scoreInquiryLead } from "../utils/leadScoring.js";

test("scoreInquiryLead marks strong custom trip requests as hot", () => {
  const result = scoreInquiryLead({
    destinations: ["Serengeti", "Ngorongoro"],
    tripLengthDays: 7,
    adults: 2,
    budget: "Luxury",
    travelWhen: "July 2026",
    message: "We want a premium migration safari with romantic lodges and private guiding.",
    contactPreference: "whatsapp",
    sourceChannel: "plan-my-trip",
    accommodationPreferences: ["Luxury lodge"],
    services: ["airport pickup", "photography"],
  });

  assert.equal(result.leadTemperature, "hot");
  assert.equal(result.leadScore >= 70, true);
  assert.equal(result.leadScoreReasons.length > 0, true);
});

test("scoreInquiryLead marks low-information requests as cold", () => {
  const result = scoreInquiryLead({
    destinations: ["Tanzania Safari"],
    tripLengthDays: 2,
    adults: 1,
    travelWhen: "Flexible",
    message: "Hi",
    contactPreference: "email",
    sourceChannel: "website",
    accommodationPreferences: ["Flexible"],
  });

  assert.equal(result.leadTemperature, "cold");
  assert.equal(result.leadScore < 40, true);
});

test("scoreInquiryLead boosts hotel marketplace intent with clear reasons", () => {
  const result = scoreInquiryLead({
    destinations: ["Arusha"],
    tripLengthDays: 2,
    adults: 2,
    travelWhen: "July 2026",
    message: "Interested in this hotel for arrival night.",
    contactPreference: "whatsapp",
    sourceChannel: "global-marketplace",
    accommodationPreferences: ["Arusha Garden Lodge"],
    hotelId: "hotel-1",
    hotelName: "Arusha Garden Lodge",
    hotelIntentType: "direct-hotel",
  });

  assert.equal(result.leadScoreReasons.includes("Hotel marketplace inquiry intent"), true);
  assert.equal(result.leadScoreReasons.includes("Direct hotel request"), true);
  assert.equal(result.leadScore >= 50, true);
});
