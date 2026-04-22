import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWhatsAppUrl,
  generateInquiryLeadAutomation,
} from "../utils/leadAutomation.js";

test("buildWhatsAppUrl encodes the phone number and message", () => {
  const url = buildWhatsAppUrl("+255 710 887 798", "Hello safari team");

  assert.equal(
    url,
    "https://wa.me/255710887798?text=Hello%20safari%20team"
  );
});

test("generateInquiryLeadAutomation returns a summary, follow-up, and whatsapp url", () => {
  const automation = generateInquiryLeadAutomation(
    {
      firstName: "Amina",
      name: "Amina Joseph",
      destinations: ["Serengeti Safari"],
      travelWhen: "July 2026",
      adults: 2,
      tripLengthDays: 6,
      budget: "Mid-range",
      message: "We want a migration-focused honeymoon trip.",
    },
    {
      tenantName: "MAZ Expeditions",
      whatsappNumber: "+255710887798",
    }
  );

  assert.ok(automation.summary.includes("Amina"));
  assert.ok(automation.summary.includes("Serengeti Safari"));
  assert.ok(automation.followUpMessage.includes("July 2026"));
  assert.ok(automation.followUpMessage.includes("migration-focused honeymoon trip"));
  assert.ok(automation.whatsappUrl.startsWith("https://wa.me/255710887798?text="));
});
