import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  generateInquiryLeadAutomation,
  enhanceHotelInquiryAutomation,
} from "../utils/leadAutomation.js";

test("enhanceHotelInquiryAutomation adds operator hints for direct hotel inquiries", () => {
  const automation = enhanceHotelInquiryAutomation(
    generateInquiryLeadAutomation({
      firstName: "Amina",
      destinations: ["Arusha"],
      tripLengthDays: 2,
      adults: 2,
      travelWhen: "July 2026",
      message: "Interested in the garden lodge.",
    }),
    {
      hotelId: "hotel-1",
      hotelName: "Arusha Garden Lodge",
      hotelIntentType: "direct-hotel",
      accommodationPreferences: ["Arusha Garden Lodge", "lodge"],
    }
  );

  assert.equal(automation.hotelLead.hotelId, "hotel-1");
  assert.equal(automation.hotelLead.intentLabel, "Direct hotel inquiry");
  assert.equal(automation.summary.includes("Direct hotel inquiry: Arusha Garden Lodge"), true);
  assert.equal(
    automation.operatorChecklist.includes("Confirm room fit, rough availability window, and next-step contact owner."),
    true
  );
});

test("enhanceHotelInquiryAutomation adds itinerary planning hints for hotel add-ons", () => {
  const automation = enhanceHotelInquiryAutomation(
    generateInquiryLeadAutomation({
      firstName: "Amina",
      destinations: ["Serengeti"],
      tripLengthDays: 7,
      adults: 2,
      travelWhen: "August 2026",
      message: "Please include the camp in my safari.",
    }),
    {
      hotelId: "hotel-2",
      hotelName: "Serengeti Migration Camp",
      hotelIntentType: "itinerary-add-on",
    }
  );

  assert.equal(automation.hotelLead.intentLabel, "Itinerary hotel add-on");
  assert.equal(
    automation.operatorChecklist.includes("Check route fit, nights, transfer logic, and operator package pairing."),
    true
  );
});

test("custom inquiry creation applies hotel inquiry automation hints", async () => {
  const source = await readFile(new URL("../routes/customInquiryRoutes.js", import.meta.url), "utf8");

  assert.equal(source.includes("enhanceHotelInquiryAutomation"), true);
  assert.equal(source.includes("const automation = enhanceHotelInquiryAutomation("), true);
});
