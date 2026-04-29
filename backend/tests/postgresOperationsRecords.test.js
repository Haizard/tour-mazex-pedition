import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAccommodationReservationDelete,
  buildAccommodationReservationUpsert,
  buildAirportPickupDelete,
  buildAirportPickupUpsert,
  buildGuideDriverAssignmentDelete,
  buildGuideDriverAssignmentUpsert,
} from "../utils/postgresOperationsRecords.js";

test("buildGuideDriverAssignmentUpsert targets guide_driver_assignment_records", () => {
  const statement = buildGuideDriverAssignmentUpsert({
    _id: "guide-1",
    tenantId: "tenant-1",
    staffType: "guide",
    fullName: "Amina Guide",
    availabilityStatus: "assigned",
  });

  assert.equal(statement.text.includes("guide_driver_assignment_records"), true);
  assert.equal(statement.values[0], "guide-1");
  assert.equal(statement.values[4], "Amina Guide");
});

test("buildAccommodationReservationUpsert targets accommodation_reservation_records", () => {
  const statement = buildAccommodationReservationUpsert({
    _id: "stay-1",
    tenantId: "tenant-1",
    hotelName: "Serengeti Lodge",
    status: "confirmed",
  });

  assert.equal(statement.text.includes("accommodation_reservation_records"), true);
  assert.equal(statement.values[0], "stay-1");
  assert.equal(statement.values[4], "Serengeti Lodge");
});

test("buildAirportPickupUpsert targets airport_pickup_records", () => {
  const statement = buildAirportPickupUpsert({
    _id: "pickup-1",
    tenantId: "tenant-1",
    guestName: "Traveler One",
    airportCode: "JRO",
  });

  assert.equal(statement.text.includes("airport_pickup_records"), true);
  assert.equal(statement.values[0], "pickup-1");
  assert.equal(statement.values[5], "JRO");
});

test("buildGuideDriverAssignmentDelete targets guide_driver_assignment_records", () => {
  const statement = buildGuideDriverAssignmentDelete("guide-1", "tenant-1");

  assert.equal(statement.text.includes("guide_driver_assignment_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["guide-1", "tenant-1"]);
});

test("buildAccommodationReservationDelete targets accommodation_reservation_records", () => {
  const statement = buildAccommodationReservationDelete("stay-1", "tenant-1");

  assert.equal(statement.text.includes("accommodation_reservation_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["stay-1", "tenant-1"]);
});

test("buildAirportPickupDelete targets airport_pickup_records", () => {
  const statement = buildAirportPickupDelete("pickup-1", "tenant-1");

  assert.equal(statement.text.includes("airport_pickup_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["pickup-1", "tenant-1"]);
});
