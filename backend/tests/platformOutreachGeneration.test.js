import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlatformOutreachPrompt,
  classifyPlatformReplyIntent,
  generatePlatformOutreachWithLlm,
  parseGeneratedOutreachJson,
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

test("parseGeneratedOutreachJson accepts fenced JSON responses", () => {
  const parsed = parseGeneratedOutreachJson(`Here is the draft:\n\n\`\`\`json\n{"subject":"Demo","body":"Hello","confidence":0.82,"guardrailNotes":["safe"]}\n\`\`\``);

  assert.deepEqual(parsed, {
    subject: "Demo",
    body: "Hello",
    confidence: 0.82,
    guardrailNotes: ["safe"],
  });
});

test("generatePlatformOutreachWithLlm fails clearly without credentials", async () => {
  await assert.rejects(
    () =>
      generatePlatformOutreachWithLlm({
        campaign: { title: "Launch" },
        prospect: { companyName: "Kili Tours" },
        env: {},
      }),
    /AI credentials/i,
  );
});

test("generatePlatformOutreachWithLlm validates provider JSON output", async () => {
  const generated = await generatePlatformOutreachWithLlm({
    campaign: { title: "Launch" },
    prospect: { companyName: "Kili Tours" },
    env: { GEMINI_API_KEY: "test-key" },
    generateText: async ({ prompt, model }) => {
      assert.match(prompt, /Kili Tours/);
      assert.equal(model, "gemini-test");
      return JSON.stringify({
        subject: "AI demo for Kili Tours",
        body: "Hello Kili Tours, want to see Mazex?",
        confidence: 0.91,
        guardrailNotes: ["no invented claims"],
      });
    },
    model: "gemini-test",
  });

  assert.equal(generated.subject, "AI demo for Kili Tours");
  assert.equal(generated.confidence, 0.91);
  assert.deepEqual(generated.guardrailNotes, ["no invented claims"]);
});
