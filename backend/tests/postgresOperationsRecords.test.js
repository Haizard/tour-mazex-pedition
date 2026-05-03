import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAccommodationReservationLookup,
  buildAccommodationReservationView,
  buildAccommodationReservationDelete,
  buildAccommodationReservationUpsert,
  buildAirportPickupLookup,
  buildAirportPickupView,
  buildGuideDriverAssignmentLookup,
  buildGuideDriverAssignmentView,
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

test("buildGuideDriverAssignmentLookup targets one guide-driver record", () => {
  const statement = buildGuideDriverAssignmentLookup("guide-1", "tenant-1");

  assert.equal(statement.text.includes("guide_driver_assignment_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["guide-1", "tenant-1"]);
});

test("buildGuideDriverAssignmentView reconstructs the guide-driver payload", () => {
  const member = buildGuideDriverAssignmentView({
    source_id: "guide-1",
    tenant_id: "tenant-1",
    assigned_booking_id: "booking-1",
    staff_type: "guide",
    full_name: "Amina Guide",
    phone: "+255700000001",
    email: "guide@example.com",
    home_base: "Arusha",
    availability_status: "assigned",
    languages: ["English"],
    specialties: ["Wildlife"],
    assigned_tour_title: "Serengeti Escape",
    assignment_date: "2026-05-01T00:00:00.000Z",
    assignment_start_date: "2026-05-01T00:00:00.000Z",
    assignment_end_date: "2026-05-03T00:00:00.000Z",
    assignment_notes: "Brief shared",
    license_category: "",
  });

  assert.equal(member._id, "guide-1");
  assert.equal(member.fullName, "Amina Guide");
  assert.equal(member.languages[0], "English");
  assert.equal(member.availabilityStatus, "assigned");
});

test("buildAccommodationReservationDelete targets accommodation_reservation_records", () => {
  const statement = buildAccommodationReservationDelete("stay-1", "tenant-1");

  assert.equal(statement.text.includes("accommodation_reservation_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["stay-1", "tenant-1"]);
});

test("buildAccommodationReservationLookup targets one accommodation record", () => {
  const statement = buildAccommodationReservationLookup("stay-1", "tenant-1");

  assert.equal(statement.text.includes("accommodation_reservation_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["stay-1", "tenant-1"]);
});

test("buildAccommodationReservationView reconstructs the accommodation payload", () => {
  const reservation = buildAccommodationReservationView({
    source_id: "stay-1",
    tenant_id: "tenant-1",
    booking_id: "booking-1",
    booking_guest_name: "Amina Said",
    hotel_name: "Serengeti Lodge",
    supplier_name: "Lodge Team",
    supplier_contact: "+255700000002",
    destination: "Serengeti",
    reservation_code: "RES-1",
    room_plan: "Double",
    check_in_date: "2026-05-01T00:00:00.000Z",
    check_out_date: "2026-05-03T00:00:00.000Z",
    guest_count: 2,
    status: "confirmed",
    notes: "VIP guest",
    assigned_tour_title: "Serengeti Escape",
  });

  assert.equal(reservation._id, "stay-1");
  assert.equal(reservation.hotelName, "Serengeti Lodge");
  assert.equal(reservation.status, "confirmed");
  assert.equal(reservation.guestCount, 2);
});

test("buildAirportPickupDelete targets airport_pickup_records", () => {
  const statement = buildAirportPickupDelete("pickup-1", "tenant-1");

  assert.equal(statement.text.includes("airport_pickup_records"), true);
  assert.equal(statement.text.includes("delete from"), true);
  assert.deepEqual(statement.values, ["pickup-1", "tenant-1"]);
});

test("buildAirportPickupLookup targets one airport pickup record", () => {
  const statement = buildAirportPickupLookup("pickup-1", "tenant-1");

  assert.equal(statement.text.includes("airport_pickup_records"), true);
  assert.equal(statement.text.includes("where source_id = $1 and tenant_id = $2"), true);
  assert.deepEqual(statement.values, ["pickup-1", "tenant-1"]);
});

test("buildAirportPickupView reconstructs the airport pickup payload", () => {
  const pickup = buildAirportPickupView({
    source_id: "pickup-1",
    tenant_id: "tenant-1",
    booking_id: "booking-1",
    driver_id: "driver-1",
    guest_name: "Traveler One",
    airport_code: "JRO",
    flight_number: "KQ123",
    pickup_date_time: "2026-05-01T10:00:00.000Z",
    destination_label: "Arusha",
    assigned_tour_title: "Serengeti Escape",
    driver_name: "Driver One",
    vehicle_label: "Toyota",
    guest_count: 2,
    status: "scheduled",
    notes: "Meet at arrivals",
  });

  assert.equal(pickup._id, "pickup-1");
  assert.equal(pickup.airportCode, "JRO");
  assert.equal(pickup.driverName, "Driver One");
  assert.equal(pickup.status, "scheduled");
});
