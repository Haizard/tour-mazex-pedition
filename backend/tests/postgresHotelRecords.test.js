import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelRecordDelete,
  buildHotelRecordLookup,
  buildHotelRecordUpsert,
  buildHotelRecordView,
} from "../utils/postgresHotelRecords.js";

test("buildHotelRecordUpsert targets hotel_records with public marketplace fields", () => {
  const statement = buildHotelRecordUpsert({
    _id: "hotel-1",
    tenantId: "tenant-1",
    name: "Arusha Garden Lodge",
    slug: "arusha-garden-lodge",
    destination: "Arusha",
    region: "Northern Tanzania",
    accommodationType: "lodge",
    amenities: ["Pool", "Airport transfer"],
    published: true,
    marketplaceVisible: true,
    sponsoredPlacement: true,
    partnerAccountId: "partner-1",
  });

  assert.equal(statement.text.includes("hotel_records"), true);
  assert.equal(statement.values[0], "hotel-1");
  assert.equal(statement.values[2], "Arusha Garden Lodge");
  assert.equal(statement.values[11], true);
  assert.equal(statement.values[12], true);
  assert.equal(statement.values[13], true);
});

test("buildHotelRecordLookup targets one tenant-scoped hotel record", () => {
  const statement = buildHotelRecordLookup("hotel-1", "tenant-1");

  assert.equal(statement.text.includes("hotel_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["hotel-1", "tenant-1"]);
});

test("buildHotelRecordDelete targets hotel_records", () => {
  const statement = buildHotelRecordDelete("hotel-1", "tenant-1");

  assert.equal(statement.text.includes("delete from"), true);
  assert.equal(statement.text.includes("hotel_records"), true);
  assert.deepEqual(statement.values, ["hotel-1", "tenant-1"]);
});

test("buildHotelRecordView reconstructs hotel marketplace payload", () => {
  const hotel = buildHotelRecordView({
    source_id: "hotel-1",
    tenant_id: "tenant-1",
    name: "Arusha Garden Lodge",
    slug: "arusha-garden-lodge",
    summary: "Quiet pre-safari base",
    destination: "Arusha",
    region: "Northern Tanzania",
    accommodation_type: "lodge",
    amenities: ["Pool"],
    room_style_summary: "Garden rooms",
    average_rating: "4.7",
    review_count: 18,
    published: true,
    marketplace_visible: true,
    sponsored_placement: false,
    partner_account_id: "partner-1",
  });

  assert.equal(hotel._id, "hotel-1");
  assert.equal(hotel.name, "Arusha Garden Lodge");
  assert.equal(hotel.averageRating, 4.7);
  assert.equal(hotel.reviewCount, 18);
  assert.deepEqual(hotel.amenities, ["Pool"]);
});
