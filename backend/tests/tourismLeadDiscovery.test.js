import assert from "node:assert/strict";
import { test } from "node:test";

import {
  analyzeTourismLeadSource,
  extractBusinessContacts,
  scoreTourismLeadCandidate,
} from "../utils/tourismLeadDiscovery.js";

test("extractBusinessContacts keeps public business contacts and blocks personal/private contacts", () => {
  const result = extractBusinessContacts({
    sourceUrl: "https://kilimanjaroexampletours.com/contact",
    pageText: `
      Kilimanjaro Example Tours Ltd
      For partnerships email bookings@kilimanjaroexampletours.com or sales@kilimanjaroexampletours.com.
      WhatsApp: https://wa.me/255712345678
      Personal guide: john@gmail.com
    `,
  });

  assert.deepEqual(
    result.allowedContacts.map((contact) => contact.value),
    ["bookings@kilimanjaroexampletours.com", "sales@kilimanjaroexampletours.com", "+255712345678"]
  );
  assert.equal(result.blockedContacts.length, 1);
  assert.equal(result.blockedContacts[0].reason, "personal-email-provider");
});

test("analyzeTourismLeadSource rejects forbidden review sources unless they link to an official business site", () => {
  const blocked = analyzeTourismLeadSource({
    sourceUrl: "https://www.tripadvisor.com/Attraction_Review-example",
    pageText: "Call guide personally on +255700000000",
  });

  assert.equal(blocked.sourcePolicy.allowed, false);
  assert.equal(blocked.sourcePolicy.reason, "review-platform-direct-scraping-blocked");
  assert.equal(blocked.allowedContacts.length, 0);

  const allowed = analyzeTourismLeadSource({
    sourceUrl: "https://www.tripadvisor.com/Attraction_Review-example",
    officialWebsiteUrl: "https://operator-example.co.tz",
    pageText: "Official website lists info@operator-example.co.tz and wa.me/255755123456",
  });

  assert.equal(allowed.sourcePolicy.allowed, true);
  assert.equal(allowed.sourcePolicy.reason, "official-business-website-from-review-source");
  assert.equal(allowed.allowedContacts.length, 2);
});

test("scoreTourismLeadCandidate prioritizes marketplace and commission-ready B2B partners", () => {
  const candidate = scoreTourismLeadCandidate({
    organizationName: "Serengeti Lodge Transfers",
    categories: ["tour-operator", "transport", "accommodation"],
    allowedContacts: [
      { type: "email", value: "partners@serengetitransfers.co.tz" },
      { type: "whatsapp", value: "+255712345678" },
    ],
    sourcePolicy: { allowed: true },
    complianceFlags: ["public-business-contact", "source-attributed"],
    pageText: "We offer safari packages, lodge transfers, B2B partnerships, affiliate commission and travel agency rates.",
  });

  assert.equal(candidate.outreachAllowed, true);
  assert.equal(candidate.recommendedUseCases.includes("marketplace-partnership"), true);
  assert.equal(candidate.recommendedUseCases.includes("commission-growth"), true);
  assert.equal(candidate.leadScore >= 70, true);
});
