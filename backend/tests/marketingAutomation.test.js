import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import Campaign from "../models/Campaign.js";
import {
  generateCampaignSuggestion,
  repurposeBlogContent,
} from "../utils/marketingAutomation.js";

test("repurposeBlogContent creates channel-specific marketing assets", () => {
  const result = repurposeBlogContent({
    title: "Why the Green Season is a Hidden Gem",
    content:
      "Travelers who choose the green season enjoy dramatic skies, fewer crowds, and excellent value across Tanzania.",
    category: "Safari Articles",
  });

  assert.equal(result.instagramPosts.length, 3);
  assert.equal(result.facebookPosts.length, 2);
  assert.ok(result.emailCampaign.subject.includes("Green Season"));
  assert.ok(result.whatsappMessage.includes("Green Season"));
});

test("generateCampaignSuggestion creates a migration campaign window", () => {
  const result = generateCampaignSuggestion({
    campaignType: "migration",
    title: "Wildebeest Migration Push",
    month: "July",
  });

  assert.equal(result.status, "draft");
  assert.ok(result.summary.includes("migration"));
  assert.ok(result.channels.includes("instagram"));
});

test("Campaign validation requires at least one channel", () => {
  const campaign = new Campaign({
    tenantId: new mongoose.Types.ObjectId(),
    title: "Empty campaign",
    campaignType: "seasonal",
    summary: "No channels set.",
    status: "draft",
    channels: [],
  });

  const validationError = campaign.validateSync();

  assert.ok(validationError);
  assert.ok(validationError.errors.channels);
});
