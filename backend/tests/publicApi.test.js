import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildDistributionLinkSet,
  buildPlannerEmbedSnippet,
} from "../utils/distributionChannels.js";

// ── Utility-level tests (no DB required) ────────────────────────────────────

describe("publicApi — distribution link utilities", () => {
  it("buildDistributionLinkSet returns all three channel URLs", () => {
    const links = buildDistributionLinkSet({
      baseUrl: "https://mazexpeditions.com",
      tenantName: "MAZ Expeditions",
      tenantSlug: "maz",
      referralCode: "partner-abc",
      campaignLabel: "q2-push",
    });

    assert.ok(links.hostedPlannerUrl.includes("/plan-my-trip"), "hosted URL should contain /plan-my-trip");
    assert.ok(links.embedPlannerUrl.includes("/embed/plan-my-trip"), "embed URL should contain /embed/plan-my-trip");
    assert.ok(links.partnerReferralUrl.includes("partner-referral"), "partner URL should contain partner-referral");
    assert.ok(links.hostedPlannerUrl.includes("q2-push"), "campaign label should be in hosted URL");
    assert.ok(links.partnerReferralUrl.includes("partner-abc"), "referral code should be in partner URL");
  });

  it("buildPlannerEmbedSnippet produces a valid iframe string", () => {
    const snippet = buildPlannerEmbedSnippet({
      embedPlannerUrl: "https://mazexpeditions.com/embed/plan-my-trip?source=embed-widget",
      title: "Safari Trip Planner",
      height: 800,
    });

    assert.ok(snippet.includes("<iframe"), "snippet should start with iframe tag");
    assert.ok(snippet.includes("src="), "snippet should have src attribute");
    assert.ok(snippet.includes("min-height:800px"), "snippet should use the custom height");
    assert.ok(snippet.includes("Safari Trip Planner"), "snippet should include the title");
  });
});

// ── API key model (static methods, no DB) ─────────────────────────────────

describe("ApiKey — static generation", async () => {
  const ApiKey = (await import("../models/ApiKey.js")).default;

  it("generateKey returns a raw key, hash, and prefix", () => {
    const { raw, keyHash, keyPrefix } = ApiKey.generateKey();
    assert.ok(raw.startsWith("mzx_"), "raw key should start with mzx_");
    assert.ok(raw.length > 20, "raw key should be long enough");
    assert.strictEqual(keyHash.length, 64, "SHA-256 hex hash should be 64 chars");
    assert.ok(keyPrefix.length > 0, "prefix should not be empty");
    assert.ok(raw.startsWith(keyPrefix), "raw key should start with its own prefix");
  });

  it("two generateKey calls return different keys", () => {
    const { raw: raw1 } = ApiKey.generateKey();
    const { raw: raw2 } = ApiKey.generateKey();
    assert.notStrictEqual(raw1, raw2, "keys should be unique per generation");
  });
});

// ── Public API tour response shape (mocked) ────────────────────────────────

describe("publicApi — tour response contract", () => {
  const mockTour = {
    _id: "6640000000000000000000aa",
    title: "Kilimanjaro Summit Trek",
    location: "Tanzania",
    tourType: "climbing",
    category: "adventure",
    price: 2800,
    duration: "8 days",
    description: "Climb Africa's highest peak.",
    highlights: ["Uhuru Peak", "Marangu Route"],
    image: "https://cdn.example.com/kili.jpg",
    createdAt: new Date(),
  };

  const buildTourResponse = (t, baseUrl = "https://example.com") => ({
    id: t._id,
    title: t.title,
    location: t.location,
    tourType: t.tourType,
    price: t.price,
    bookingUrl: `${baseUrl}/plan-my-trip?tour=${encodeURIComponent(t.title)}`,
  });

  it("tour response includes expected fields", () => {
    const response = buildTourResponse(mockTour);
    assert.ok(response.id, "id should be present");
    assert.ok(response.title, "title should be present");
    assert.ok(response.price > 0, "price should be positive");
    assert.ok(response.bookingUrl.includes("plan-my-trip"), "bookingUrl should point to planner");
    assert.ok(
      response.bookingUrl.includes(encodeURIComponent("Kilimanjaro Summit Trek")),
      "tour title should be URL-encoded in booking URL"
    );
  });
});
