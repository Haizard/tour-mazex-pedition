import test from "node:test";
import assert from "node:assert/strict";

import { summarizeLanguageAssistantProfile } from "../utils/languageAssistant.js";

test("summarizeLanguageAssistantProfile highlights active translation packs", () => {
  const result = summarizeLanguageAssistantProfile({
    language: "French",
    status: "active",
    useCases: ["sales replies", "tour explanations"],
  });

  assert.equal(result.badgeLabel, "Active");
  assert.equal(result.summary.includes("French"), true);
  assert.equal(result.summary.includes("sales replies"), true);
});

test("summarizeLanguageAssistantProfile highlights draft packs", () => {
  const result = summarizeLanguageAssistantProfile({
    language: "German",
    status: "draft",
  });

  assert.equal(result.badgeLabel, "Draft");
  assert.equal(result.summary.includes("draft"), true);
});
