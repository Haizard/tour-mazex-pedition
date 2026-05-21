import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHotelDelete,
  buildHotelLookup,
  buildHotelUpsert,
  buildHotelView,
} from "../utils/postgresHotelRecords.js";
import { normalizePrimaryHotelRows } from "../utils/postgresPrimaryReads.js";

test("buildHotelUpsert targets hotel_records", () => {
  const statement = buildHotelUpsert({
    _id: "hotel-1",
    tenantId: "tenant-1",
    hotelName: "Serengeti Serena Lodge",
    slug: "serengeti-serena-lodge",
    destination: "Serengeti",
    hotelType: "lodge",
    status: "published",
  });

  assert.equal(statement.text.includes("hotel_records"), true);
  assert.equal(statement.values[0], "hotel-1");
  assert.equal(statement.values[3], "Serengeti Serena Lodge");
  assert.equal(statement.values[4], "serengeti-serena-lodge");
});

test("buildHotelDelete targets hotel_records", () => {
  const statement = buildHotelDelete("hotel-1", "tenant-1");

  assert.equal(statement.text.includes("hotel_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["hotel-1", "tenant-1"]);
});

test("buildHotelLookup targets one hotel record", () => {
  const statement = buildHotelLookup("hotel-1", "tenant-1");

  assert.equal(statement.text.includes("hotel_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["hotel-1", "tenant-1"]);
});

test("buildHotelView reconstructs the hotel payload", () => {
  const hotel = buildHotelView({
    source_id: "hotel-1",
    tenant_id: "tenant-1",
    partner_account_id: "partner-1",
    hotel_name: "Serengeti Serena Lodge",
    slug: "serengeti-serena-lodge",
    destination: "Serengeti",
    region: "Northern Circuit",
    hotel_type: "lodge",
    description: "Luxury safari lodge with sunset views.",
    amenity_tags: ["pool", "wifi"],
    room_style_summary: "Luxury safari suites",
    published_status: "published",
    trust_rating: "4.8",
    review_count: "12",
  });

  assert.equal(hotel._id, "hotel-1");
  assert.equal(hotel.partnerAccountId, "partner-1");
  assert.equal(hotel.hotelName, "Serengeti Serena Lodge");
  assert.equal(hotel.slug, "serengeti-serena-lodge");
  assert.equal(hotel.destination, "Serengeti");
  assert.equal(hotel.hotelType, "lodge");
  assert.equal(hotel.publishedStatus, "published");
  assert.equal(hotel.trust.rating, 4.8);
  assert.equal(hotel.trust.reviewCount, 12);
});

test("normalizePrimaryHotelRows rebuilds hotel rows from postgres rows", () => {
  const rows = normalizePrimaryHotelRows([
    {
      source_id: "hotel-1",
      tenant_id: "tenant-1",
      partner_account_id: "partner-1",
      hotel_name: "Serengeti Serena Lodge",
      slug: "serengeti-serena-lodge",
      destination: "Serengeti",
      region: "Northern Circuit",
      hotel_type: "lodge",
      description: "Luxury safari lodge with sunset views.",
      amenity_tags: ["pool", "wifi"],
      room_style_summary: "Luxury safari suites",
      published_status: "published",
      trust_rating: "4.8",
      review_count: "12",
      latitude: "-2.333",
      longitude: "34.833",
      source_payload: {
        aiHighlights: ["Best for honeymoon stays"],
      },
    },
  ]);

  assert.equal(rows[0]._id, "hotel-1");
  assert.equal(rows[0].partnerAccountId, "partner-1");
  assert.equal(rows[0].hotelName, "Serengeti Serena Lodge");
  assert.equal(rows[0].coordinates.latitude, -2.333);
  assert.equal(rows[0].coordinates.longitude, 34.833);
  assert.equal(rows[0].trust.rating, 4.8);
  assert.equal(rows[0].aiHighlights[0], "Best for honeymoon stays");
});

