import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import SocialPost from "../models/SocialPost.js";
import { generateSocialPostSuggestions } from "../utils/socialPostGeneration.js";

test("generateSocialPostSuggestions returns fallback content with hashtags and images", async () => {
  const result = await generateSocialPostSuggestions({
    title: "Serengeti Migration Escape",
    location: "Serengeti National Park",
    duration: "5 Days",
    description: "Witness the wildebeest migration with expert guides and curated lodges.",
    image: "https://example.com/cover.jpg",
    galleryImages: ["https://example.com/gallery-1.jpg"],
  });

  assert.equal(typeof result.caption, "string");
  assert.ok(result.caption.includes("Serengeti Migration Escape"));
  assert.ok(Array.isArray(result.hashtags));
  assert.ok(result.hashtags.length > 0);
  assert.ok(Array.isArray(result.imageCandidates));
  assert.ok(result.imageCandidates.length > 0);
  assert.equal(result.generationMeta.usedFallback, true);
});

test("SocialPost validation requires a schedule date when status is scheduled", () => {
  const socialPost = new SocialPost({
    tenantId: new mongoose.Types.ObjectId(),
    title: "Migration social draft",
    platforms: ["instagram"],
    status: "scheduled",
    caption: "Migration season is calling.",
    hashtags: ["#serengeti"],
    imageUrls: ["https://example.com/cover.jpg"],
  });

  const validationError = socialPost.validateSync();

  assert.ok(validationError);
  assert.ok(validationError.errors.scheduledFor);
});

test("SocialPost validation rejects unknown platforms", () => {
  const socialPost = new SocialPost({
    tenantId: new mongoose.Types.ObjectId(),
    title: "Invalid platform post",
    platforms: ["tiktok"],
    status: "draft",
    caption: "Adventure awaits.",
  });

  const validationError = socialPost.validateSync();

  assert.ok(validationError);
  assert.ok(validationError.errors["platforms.0"]);
});
