import test from "node:test";
import assert from "node:assert/strict";

import { buildHotelAssistantKnowledgeRecord } from "../utils/postgresHotelVectorService.js";

test("buildHotelAssistantKnowledgeRecord prepares a vector record for public hotel discovery", () => {
  const record = buildHotelAssistantKnowledgeRecord({
    _id: "hotel-1",
    tenantId: "tenant-1",
    name: "Arusha Garden Lodge",
    destination: "Arusha",
    region: "Northern Circuit",
    accommodationType: "lodge",
    summary: "Quiet stay before safari",
    roomStyleSummary: "garden rooms",
    amenities: ["Pool", "Airport transfer"],
    marketplaceVisible: true,
    published: true,
    averageRating: 4.8,
    reviewCount: 21,
  });

  assert.equal(record.sourceType, "hotel-listing");
  assert.equal(record.sourceId, "hotel-1");
  assert.equal(record.tenantId, "tenant-1");
  assert.equal(record.title, "Arusha Garden Lodge");
  assert.equal(record.body.includes("Arusha"), true);
  assert.equal(record.body.includes("Pool"), true);
  assert.equal(record.metadata.accommodationType, "lodge");
  assert.equal(record.metadata.marketplaceVisible, true);
});
