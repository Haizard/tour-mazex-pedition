import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlatformOutreachPrompt,
  classifyPlatformReplyIntent,
  validateGeneratedOutreach,
} from "../utils/platformOutreachGeneration.js";

test("buildPlatformOutreachPrompt includes campaign and prospect context", () => {
  const prompt = buildPlatformOutreachPrompt({
    campaign: { title: "AI Website Launch", objective: "Book demos", tone: "professional" },
    prospect: { companyName: "Kili Tours", country: "Tanzania", website: "https://example.com" },
    channel: "email",
  });

  assert.match(prompt, /AI Website Launch/);
  assert.match(prompt, /Kili Tours/);
  assert.match(prompt, /platform brand only/i);
});

test("classifyPlatformReplyIntent escalates legal and discount requests", () => {
  assert.equal(classifyPlatformReplyIntent("Can you guarantee clients?").requiresEscalation, true);
  assert.equal(classifyPlatformReplyIntent("Can I get a custom discount?").requiresEscalation, true);
  assert.equal(classifyPlatformReplyIntent("How does the AI chatbot work?").requiresEscalation, false);
});

test("validateGeneratedOutreach rejects empty generated body", () => {
  assert.throws(() => validateGeneratedOutreach({ body: "" }), /body/i);
});
