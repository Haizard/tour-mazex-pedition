import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlatformProspectPayload,
  buildProspectDuplicateQuery,
  normalizeEmail,
  normalizeWhatsAppNumber,
} from "../utils/platformOutreachProspects.js";

test("normalizeEmail trims and lowercases email addresses", () => {
  assert.equal(normalizeEmail("  Sales@KILI-TOURS.COM "), "sales@kili-tours.com");
});

test("normalizeWhatsAppNumber keeps a leading plus and digits", () => {
  assert.equal(normalizeWhatsAppNumber(" +255 712-345-678 "), "+255712345678");
});

test("buildPlatformProspectPayload requires at least one contact channel", () => {
  assert.throws(
    () => buildPlatformProspectPayload({ companyName: "Kili Tours", sourceUrl: "https://example.com" }),
    /email or WhatsApp number/i
  );
});

test("buildPlatformProspectPayload requires public source attribution", () => {
  assert.throws(
    () => buildPlatformProspectPayload({ companyName: "Kili Tours", email: "sales@example.com" }),
    /source URL/i
  );
});

test("buildPlatformProspectPayload creates a clean cold-prospect record", () => {
  const payload = buildPlatformProspectPayload({
    companyName: " Kili Tours ",
    contactName: "Sales Team",
    email: " SALES@EXAMPLE.COM ",
    whatsappNumber: " +255 700 111 222 ",
    website: "HTTPS://EXAMPLE.COM/",
    country: "Tanzania",
    sourceUrl: "https://directory.example.com/kili",
    tags: "safari, arusha",
  });

  assert.equal(payload.companyName, "Kili Tours");
  assert.equal(payload.email, "sales@example.com");
  assert.equal(payload.whatsappNumber, "+255700111222");
  assert.equal(payload.website, "https://example.com");
  assert.equal(payload.sourceUrl, "https://directory.example.com/kili");
  assert.deepEqual(payload.tags, ["safari", "arusha"]);
  assert.equal(payload.status, "new");
  assert.equal(payload.emailOptOut, false);
  assert.equal(payload.whatsappOptInStatus, "unknown");
});

test("buildProspectDuplicateQuery prefers normalized contact fields", () => {
  const query = buildProspectDuplicateQuery({
    email: "sales@example.com",
    whatsappNumber: "+255700111222",
    website: "https://example.com",
  });

  assert.deepEqual(query, {
    $or: [
      { email: "sales@example.com" },
      { whatsappNumber: "+255700111222" },
      { website: "https://example.com" },
    ],
  });
});
