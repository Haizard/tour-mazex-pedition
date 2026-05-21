import { createPostgresClient } from "./postgresClient.js";

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL operations writer is not configured.");
  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const deleteRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL operations writer is not configured.");
  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const querySingleRow = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL operations reader is not configured.");
  try {
    await client.connect();
    const result = await client.query(statement.text, statement.values);
    return result.rows[0] || null;
  } finally {
    await client.end().catch(() => {});
  }
};

// --- Guide/Driver Assignments ---

export const buildGuideDriverAssignmentRecord = (assignment = {}) => ({
  sourceId: String(assignment._id || ""),
  tenantId: String(assignment.tenantId || ""),
  assignedBookingId: String(assignment.assignedBookingId || ""),
  staffType: assignment.staffType || "guide",
  fullName: assignment.fullName || "",
  phone: assignment.phone || "",
  email: assignment.email || "",
  homeBase: assignment.homeBase || "",
  availabilityStatus: assignment.availabilityStatus || "available",
  languages: Array.isArray(assignment.languages) ? assignment.languages : [],
  specialties: Array.isArray(assignment.specialties) ? assignment.specialties : [],
  assignedTourTitle: assignment.assignedTourTitle || "",
  assignmentDate: assignment.assignmentDate ? new Date(assignment.assignmentDate) : null,
  assignmentStartDate: assignment.assignmentStartDate ? new Date(assignment.assignmentStartDate) : null,
  assignmentEndDate: assignment.assignmentEndDate ? new Date(assignment.assignmentEndDate) : null,
  assignmentNotes: assignment.assignmentNotes || "",
  licenseCategory: assignment.licenseCategory || "",
  sourcePayload: assignment,
});

export const buildGuideDriverAssignmentUpsert = (assignment = {}) => {
  const record = buildGuideDriverAssignmentRecord(assignment);
  return {
    text: `
      insert into public.guide_driver_assignment_records (
        source_id, tenant_id, assigned_booking_id, staff_type, full_name, phone, email,
        home_base, availability_status, languages, specialties, assigned_tour_title,
        assignment_date, assignment_start_date, assignment_end_date, assignment_notes,
        license_category, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        assigned_booking_id = excluded.assigned_booking_id,
        staff_type = excluded.staff_type,
        full_name = excluded.full_name,
        phone = excluded.phone,
        email = excluded.email,
        home_base = excluded.home_base,
        availability_status = excluded.availability_status,
        languages = excluded.languages,
        specialties = excluded.specialties,
        assigned_tour_title = excluded.assigned_tour_title,
        assignment_date = excluded.assignment_date,
        assignment_start_date = excluded.assignment_start_date,
        assignment_end_date = excluded.assignment_end_date,
        assignment_notes = excluded.assignment_notes,
        license_category = excluded.license_category,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId, record.tenantId, record.assignedBookingId, record.staffType, record.fullName, record.phone, record.email,
      record.homeBase, record.availabilityStatus, record.languages, record.specialties, record.assignedTourTitle,
      record.assignmentDate, record.assignmentStartDate, record.assignmentEndDate, record.assignmentNotes,
      record.licenseCategory, JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const syncGuideDriverAssignmentRecord = (assignment, env) =>
  upsertRecord(buildGuideDriverAssignmentUpsert(assignment), env);

// --- Accommodation Reservations ---

export const buildAccommodationReservationRecord = (reservation = {}) => ({
  sourceId: String(reservation._id || ""),
  tenantId: String(reservation.tenantId || ""),
  bookingId: String(reservation.bookingId || ""),
  hotelId: String(reservation.hotelId || ""),
  bookingGuestName: reservation.bookingGuestName || "",
  hotelName: reservation.hotelName || "",
  supplierName: reservation.supplierName || "",
  supplierContact: reservation.supplierContact || "",
  destination: reservation.destination || "",
  reservationCode: reservation.reservationCode || "",
  roomPlan: reservation.roomPlan || "",
  checkInDate: reservation.checkInDate ? new Date(reservation.checkInDate) : null,
  checkOutDate: reservation.checkOutDate ? new Date(reservation.checkOutDate) : null,
  guestCount: Number(reservation.guestCount || 1),
  status: reservation.status || "pending",
  notes: reservation.notes || "",
  assignedTourTitle: reservation.assignedTourTitle || "",
  sourcePayload: reservation,
});

export const buildAccommodationReservationUpsert = (reservation = {}) => {
  const record = buildAccommodationReservationRecord(reservation);
  return {
    text: `
      insert into public.accommodation_reservation_records (
        source_id, tenant_id, booking_id, booking_guest_name, hotel_name, supplier_name,
        supplier_contact, destination, reservation_code, room_plan, check_in_date,
        check_out_date, guest_count, status, notes, assigned_tour_title, hotel_id, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        booking_id = excluded.booking_id,
        booking_guest_name = excluded.booking_guest_name,
        hotel_name = excluded.hotel_name,
        supplier_name = excluded.supplier_name,
        supplier_contact = excluded.supplier_contact,
        destination = excluded.destination,
        reservation_code = excluded.reservation_code,
        room_plan = excluded.room_plan,
        check_in_date = excluded.check_in_date,
        check_out_date = excluded.check_out_date,
        guest_count = excluded.guest_count,
        status = excluded.status,
        notes = excluded.notes,
        assigned_tour_title = excluded.assigned_tour_title,
        hotel_id = excluded.hotel_id,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId, record.tenantId, record.bookingId, record.bookingGuestName, record.hotelName, record.supplierName,
      record.supplierContact, record.destination, record.reservationCode, record.roomPlan, record.checkInDate,
      record.checkOutDate, record.guestCount, record.status, record.notes, record.assignedTourTitle, record.hotelId,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const syncAccommodationReservationRecord = (reservation, env) =>
  upsertRecord(buildAccommodationReservationUpsert(reservation), env);

// --- Airport Pickups ---

export const buildAirportPickupRecord = (pickup = {}) => ({
  sourceId: String(pickup._id || ""),
  tenantId: String(pickup.tenantId || ""),
  bookingId: String(pickup.bookingId || ""),
  driverId: String(pickup.driverId || ""),
  guestName: pickup.guestName || "",
  airportCode: pickup.airportCode || "",
  flightNumber: pickup.flightNumber || "",
  pickupDateTime: pickup.pickupDateTime ? new Date(pickup.pickupDateTime) : null,
  destinationLabel: pickup.destinationLabel || "",
  assignedTourTitle: pickup.assignedTourTitle || "",
  driverName: pickup.driverName || "",
  vehicleLabel: pickup.vehicleLabel || "",
  guestCount: Number(pickup.guestCount || 1),
  status: pickup.status || "pending",
  notes: pickup.notes || "",
  sourcePayload: pickup,
});

export const buildAirportPickupUpsert = (pickup = {}) => {
  const record = buildAirportPickupRecord(pickup);
  return {
    text: `
      insert into public.airport_pickup_records (
        source_id, tenant_id, booking_id, driver_id, guest_name, airport_code,
        flight_number, pickup_date_time, destination_label, assigned_tour_title,
        driver_name, vehicle_label, guest_count, status, notes, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        booking_id = excluded.booking_id,
        driver_id = excluded.driver_id,
        guest_name = excluded.guest_name,
        airport_code = excluded.airport_code,
        flight_number = excluded.flight_number,
        pickup_date_time = excluded.pickup_date_time,
        destination_label = excluded.destination_label,
        assigned_tour_title = excluded.assigned_tour_title,
        driver_name = excluded.driver_name,
        vehicle_label = excluded.vehicle_label,
        guest_count = excluded.guest_count,
        status = excluded.status,
        notes = excluded.notes,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId, record.tenantId, record.bookingId, record.driverId, record.guestName, record.airportCode,
      record.flightNumber, record.pickupDateTime, record.destinationLabel, record.assignedTourTitle,
      record.driverName, record.vehicleLabel, record.guestCount, record.status, record.notes,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const syncAirportPickupRecord = (pickup, env) =>
  upsertRecord(buildAirportPickupUpsert(pickup), env);

// --- Lookups ---

export const findGuideDriverAssignmentRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildGuideDriverAssignmentLookup(sourceId, tenantId), env);

export const buildGuideDriverAssignmentLookup = (sourceId, tenantId) => ({
    text: "select * from public.guide_driver_assignment_records where source_id = $1 and tenant_id = $2 limit 1",
    values: [String(sourceId || ""), String(tenantId || "")],
});

export const findAccommodationReservationRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildAccommodationReservationLookup(sourceId, tenantId), env);

export const buildAccommodationReservationLookup = (sourceId, tenantId) => ({
    text: "select * from public.accommodation_reservation_records where source_id = $1 and tenant_id = $2 limit 1",
    values: [String(sourceId || ""), String(tenantId || "")],
});

export const findAirportPickupRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildAirportPickupLookup(sourceId, tenantId), env);

export const buildAirportPickupLookup = (sourceId, tenantId) => ({
    text: "select * from public.airport_pickup_records where source_id = $1 and tenant_id = $2 limit 1",
    values: [String(sourceId || ""), String(tenantId || "")],
});

// --- View Builders ---

export const buildGuideDriverAssignmentView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  assignedBookingId: String(row.assigned_booking_id || ""),
  staffType: String(row.staff_type || "guide"),
  fullName: String(row.full_name || ""),
  phone: String(row.phone || ""),
  email: String(row.email || ""),
  homeBase: String(row.home_base || ""),
  availabilityStatus: String(row.availability_status || "available"),
  languages: Array.isArray(row.languages) ? row.languages : [],
  specialties: Array.isArray(row.specialties) ? row.specialties : [],
  assignedTourTitle: String(row.assigned_tour_title || ""),
  assignmentDate: row.assignment_date ? new Date(row.assignment_date).toISOString() : null,
  assignmentStartDate: row.assignment_start_date ? new Date(row.assignment_start_date).toISOString() : null,
  assignmentEndDate: row.assignment_end_date ? new Date(row.assignment_end_date).toISOString() : null,
  assignmentNotes: String(row.assignment_notes || ""),
  licenseCategory: String(row.license_category || ""),
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
});

// --- Deletes ---

export const deleteGuideDriverAssignmentRecord = (sourceId, tenantId, env = globalThis.process?.env || {}) =>
  deleteRecord(buildGuideDriverAssignmentDelete(sourceId, tenantId), env);

export const buildGuideDriverAssignmentDelete = (sourceId, tenantId) => ({
    text: "delete from public.guide_driver_assignment_records where source_id = $1 and tenant_id = $2",
    values: [String(sourceId || ""), String(tenantId || "")],
});

export const deleteAccommodationReservationRecord = (sourceId, tenantId, env = globalThis.process?.env || {}) =>
  deleteRecord(buildAccommodationReservationDelete(sourceId, tenantId), env);

export const buildAccommodationReservationDelete = (sourceId, tenantId) => ({
    text: "delete from public.accommodation_reservation_records where source_id = $1 and tenant_id = $2",
    values: [String(sourceId || ""), String(tenantId || "")],
});

export const deleteAirportPickupRecord = (sourceId, tenantId, env = globalThis.process?.env || {}) =>
  deleteRecord(buildAirportPickupDelete(sourceId, tenantId), env);

export const buildAirportPickupDelete = (sourceId, tenantId) => ({
    text: "delete from public.airport_pickup_records where source_id = $1 and tenant_id = $2",
    values: [String(sourceId || ""), String(tenantId || "")],
});

// --- Accommodation View Builder ---

export const buildAccommodationReservationView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  bookingId: String(row.booking_id || ""),
  hotelId: String(row.hotel_id || ""),
  bookingGuestName: String(row.booking_guest_name || ""),
  hotelName: String(row.hotel_name || ""),
  supplierName: String(row.supplier_name || ""),
  supplierContact: String(row.supplier_contact || ""),
  destination: String(row.destination || ""),
  reservationCode: String(row.reservation_code || ""),
  roomPlan: String(row.room_plan || ""),
  checkInDate: row.check_in_date ? new Date(row.check_in_date).toISOString() : null,
  checkOutDate: row.check_out_date ? new Date(row.check_out_date).toISOString() : null,
  guestCount: Number(row.guest_count || 1),
  status: String(row.status || "pending"),
  notes: String(row.notes || ""),
  assignedTourTitle: String(row.assigned_tour_title || ""),
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
});

// --- Airport Pickup View Builder ---

export const buildAirportPickupView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  bookingId: String(row.booking_id || ""),
  driverId: String(row.driver_id || ""),
  guestName: String(row.guest_name || ""),
  airportCode: String(row.airport_code || ""),
  flightNumber: String(row.flight_number || ""),
  pickupDateTime: row.pickup_date_time ? new Date(row.pickup_date_time).toISOString() : null,
  destinationLabel: String(row.destination_label || ""),
  assignedTourTitle: String(row.assigned_tour_title || ""),
  driverName: String(row.driver_name || ""),
  vehicleLabel: String(row.vehicle_label || ""),
  guestCount: Number(row.guest_count || 1),
  status: String(row.status || "pending"),
  notes: String(row.notes || ""),
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
});
