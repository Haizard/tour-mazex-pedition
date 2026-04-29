import { createPostgresClient } from "./postgresClient.js";
import {
  buildGuideDriverCalendarView,
  buildGuideDriverDispatchBoard,
  summarizeGuideDriverAssignment,
} from "./guideDriverPlanning.js";
import {
  buildAccommodationDashboard,
  buildAccommodationStayTimeline,
  enrichAccommodationReservations,
} from "./accommodationCoordination.js";
import {
  buildAirportArrivalTimeline,
  buildAirportPickupDashboard,
  enrichAirportPickups,
} from "./airportPickupCoordination.js";

const toNumber = (value, fallback = 0) =>
  value === null || value === undefined || value === "" ? fallback : Number(value);

const toIso = (value) => (value ? new Date(value).toISOString() : null);

export const normalizePrimaryPaymentRows = (rows = []) =>
  rows.map((row = {}) => {
    const payload = row.source_payload || {};
    const paidAt = toIso(row.paid_at);
    const refundedAt = toIso(row.refunded_at);
    const cancelledAt = toIso(row.cancelled_at);
    const failedAt = toIso(payload.failedAt);
    const updatedAt = toIso(row.updated_at || payload.updatedAt);

    return {
      _id: String(row.source_id || ""),
      bookingId: row.booking_id
        ? {
            _id: String(row.booking_id),
            name: String(row.booking_name || ""),
            revenueStage: String(row.booking_revenue_stage || ""),
            paymentStatus: String(row.booking_payment_status || ""),
          }
        : null,
      customerName: String(row.customer_name || ""),
      provider: String(row.provider || "stripe"),
      amount: toNumber(row.amount),
      currency: String(row.currency || "USD"),
      feePercent: toNumber(row.fee_percent),
      feeAmount: toNumber(row.fee_amount),
      providerReference: String(row.provider_reference || ""),
      status: String(row.status || "pending"),
      failureReason: String(row.failure_reason || ""),
      checkoutUrl: String(payload.checkoutUrl || ""),
      notes: String(payload.notes || ""),
      lifecycle: {
        status: String(row.status || "pending"),
        paidAt,
        failedAt,
        cancelledAt,
        refundedAt,
        paymentUpdatedAt: refundedAt || paidAt || failedAt || cancelledAt || updatedAt,
      },
      paymentSummary: {
        summary: `${String(row.provider || "stripe").toUpperCase()} ${String(row.currency || "USD")} ${toNumber(row.amount).toLocaleString()} ${String(row.status || "pending")}`,
      },
    };
  });

export const normalizePrimaryInquiryRows = (rows = []) =>
  rows.map((row = {}) => {
    const payload = row.source_payload || {};
    return {
      _id: String(row.source_id || ""),
      tenantId: String(row.tenant_id || ""),
      name: String(row.traveler_name || ""),
      firstName: String(row.first_name || ""),
      lastName: String(row.last_name || ""),
      email: String(row.email || ""),
      phone: String(row.phone || ""),
      destinations: Array.isArray(row.destinations) ? row.destinations : [],
      travelWhen: String(row.travel_when || ""),
      budget: String(row.budget || ""),
      leadStage: String(row.lead_stage || "new"),
      status: String(row.status || "Pending"),
      sourceChannel: String(row.source_channel || "website"),
      campaignLabel: String(row.campaign_label || ""),
      referralCode: String(row.referral_code || ""),
      leadScore: toNumber(row.lead_score),
      leadTemperature: String(row.lead_temperature || "cold"),
      message: String(payload.message || ""),
      contactPreference: String(payload.contactPreference || "whatsapp"),
      followUpMessage: String(payload.followUpMessage || ""),
      automationSummary: String(payload.automationSummary || ""),
    };
  });

export const normalizePrimaryGuideDriverRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    assignedBookingId: row.assigned_booking_id ? String(row.assigned_booking_id) : "",
    staffType: String(row.staff_type || "guide"),
    fullName: String(row.full_name || ""),
    phone: String(row.phone || ""),
    email: String(row.email || ""),
    homeBase: String(row.home_base || ""),
    availabilityStatus: String(row.availability_status || "available"),
    languages: Array.isArray(row.languages) ? row.languages : [],
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    assignedTourTitle: String(row.assigned_tour_title || ""),
    assignmentDate: toIso(row.assignment_date),
    assignmentStartDate: toIso(row.assignment_start_date),
    assignmentEndDate: toIso(row.assignment_end_date),
    assignmentNotes: String(row.assignment_notes || ""),
    licenseCategory: String(row.license_category || ""),
    lastDispatchSharedAt: toIso(row.source_payload?.lastDispatchSharedAt),
  }));

export const normalizePrimaryAccommodationRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    bookingId: row.booking_id ? String(row.booking_id) : "",
    bookingGuestName: String(row.booking_guest_name || ""),
    hotelName: String(row.hotel_name || ""),
    supplierName: String(row.supplier_name || ""),
    supplierContact: String(row.supplier_contact || ""),
    destination: String(row.destination || ""),
    reservationCode: String(row.reservation_code || ""),
    roomPlan: String(row.room_plan || ""),
    checkInDate: toIso(row.check_in_date),
    checkOutDate: toIso(row.check_out_date),
    guestCount: toNumber(row.guest_count, 1),
    status: String(row.status || "pending"),
    notes: String(row.notes || ""),
    assignedTourTitle: String(row.assigned_tour_title || ""),
    lastSupplierMessageSharedAt: toIso(row.source_payload?.lastSupplierMessageSharedAt),
  }));

export const normalizePrimaryAirportPickupRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    bookingId: row.booking_id ? String(row.booking_id) : "",
    driverId: row.driver_id ? String(row.driver_id) : "",
    guestName: String(row.guest_name || ""),
    airportCode: String(row.airport_code || ""),
    flightNumber: String(row.flight_number || ""),
    pickupDateTime: toIso(row.pickup_date_time),
    destinationLabel: String(row.destination_label || ""),
    assignedTourTitle: String(row.assigned_tour_title || ""),
    driverName: String(row.driver_name || ""),
    vehicleLabel: String(row.vehicle_label || ""),
    guestCount: toNumber(row.guest_count, 1),
    status: String(row.status || "pending"),
    notes: String(row.notes || ""),
    lastDriverBriefSharedAt: toIso(row.source_payload?.lastDriverBriefSharedAt),
  }));

const normalizePrimaryBookingProjectionRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    name: String(row.traveler_name || ""),
    packageTour: String(row.package_tour || ""),
    status: String(row.status || "Pending"),
    travelDate: toIso(row.travel_date),
  }));

const queryPrimaryOperationsBookings = async (client, tenantId) => {
  const result = await client.query(
    `
      select source_id, traveler_name, package_tour, status, travel_date
      from public.booking_records
      where tenant_id = $1
      order by travel_date asc nulls last, updated_at desc
    `,
    [tenantId]
  );

  return normalizePrimaryBookingProjectionRows(result.rows);
};

export const fetchPrimaryPayments = async (tenantId = "", env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          pr.source_id,
          pr.booking_id,
          pr.provider,
          pr.provider_reference,
          pr.customer_name,
          pr.status,
          pr.currency,
          pr.amount,
          pr.fee_percent,
          pr.fee_amount,
          pr.failure_reason,
          pr.paid_at,
          pr.refunded_at,
          pr.cancelled_at,
          pr.source_payload,
          pr.updated_at,
          br.traveler_name as booking_name,
          br.revenue_stage as booking_revenue_stage,
          br.payment_status as booking_payment_status
        from public.payment_records pr
        left join public.booking_records br
          on br.source_id = pr.booking_id and br.tenant_id = pr.tenant_id
        where pr.tenant_id = $1
        order by pr.updated_at desc
      `,
      [tenantId]
    );
    return normalizePrimaryPaymentRows(result.rows);
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryInquiries = async (tenantId = "", env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          traveler_name,
          first_name,
          last_name,
          email,
          phone,
          coalesce(
            (
              select array_agg(value order by value)
              from jsonb_array_elements_text(destinations) value
            ),
            array[]::text[]
          ) as destinations,
          travel_when,
          budget,
          lead_stage,
          status,
          source_channel,
          campaign_label,
          referral_code,
          lead_score,
          lead_temperature,
          source_payload
        from public.traveler_inquiry_records
        where tenant_id = $1
        order by updated_at desc
      `,
      [tenantId]
    );
    return normalizePrimaryInquiryRows(result.rows);
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryGuideDriverData = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) {
    return {
      team: [],
      dispatchBoard: [],
      calendarView: [],
      needsAttention: [],
      stats: { total: 0, available: 0, assigned: 0, offDuty: 0 },
    };
  }

  await client.connect();
  try {
    const teamResult = await client.query(
      `
        select
          source_id,
          tenant_id,
          assigned_booking_id,
          staff_type,
          full_name,
          phone,
          email,
          home_base,
          availability_status,
          coalesce(
            (
              select array_agg(value order by value)
              from jsonb_array_elements_text(languages) value
            ),
            array[]::text[]
          ) as languages,
          coalesce(
            (
              select array_agg(value order by value)
              from jsonb_array_elements_text(specialties) value
            ),
            array[]::text[]
          ) as specialties,
          assigned_tour_title,
          assignment_date,
          assignment_start_date,
          assignment_end_date,
          assignment_notes,
          license_category,
          source_payload
        from public.guide_driver_assignment_records
        where tenant_id = $1
        order by staff_type asc, full_name asc
      `,
      [tenantId]
    );
    const bookings = await queryPrimaryOperationsBookings(client, tenantId);

    const team = normalizePrimaryGuideDriverRows(teamResult.rows).map((member) => ({
      ...member,
      assignmentSummary: summarizeGuideDriverAssignment(member),
    }));

    return {
      team,
      dispatchBoard: buildGuideDriverDispatchBoard(bookings, team),
      calendarView: buildGuideDriverCalendarView(team),
      needsAttention: team.filter(
        (member) => member.availabilityStatus === "assigned" && !member.lastDispatchSharedAt
      ),
      stats: {
        total: team.length,
        available: team.filter((member) => member.availabilityStatus === "available").length,
        assigned: team.filter((member) => member.availabilityStatus === "assigned").length,
        offDuty: team.filter((member) => member.availabilityStatus === "off-duty").length,
      },
    };
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryAccommodationData = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) {
    return {
      reservations: [],
      board: [],
      stayTimeline: [],
      needsAttention: [],
      stats: { total: 0, confirmed: 0, pending: 0, conflicts: 0 },
    };
  }

  await client.connect();
  try {
    const reservationResult = await client.query(
      `
        select
          source_id,
          tenant_id,
          booking_id,
          booking_guest_name,
          hotel_name,
          supplier_name,
          supplier_contact,
          destination,
          reservation_code,
          room_plan,
          check_in_date,
          check_out_date,
          guest_count,
          status,
          notes,
          assigned_tour_title,
          source_payload
        from public.accommodation_reservation_records
        where tenant_id = $1
        order by updated_at desc
      `,
      [tenantId]
    );
    const bookings = await queryPrimaryOperationsBookings(client, tenantId);

    const reservations = enrichAccommodationReservations(
      normalizePrimaryAccommodationRows(reservationResult.rows)
    );

    return {
      reservations,
      board: buildAccommodationDashboard(bookings, reservations),
      stayTimeline: buildAccommodationStayTimeline(reservations),
      needsAttention: reservations.filter(
        (reservation) =>
          reservation.status !== "cancelled" &&
          ((reservation.conflictCount || 0) > 0 ||
            (reservation.status === "confirmed" && !reservation.lastSupplierMessageSharedAt))
      ),
      stats: {
        total: reservations.length,
        confirmed: reservations.filter((reservation) => reservation.status === "confirmed").length,
        pending: reservations.filter((reservation) => reservation.status === "pending").length,
        conflicts: reservations.filter((reservation) => reservation.conflictCount > 0).length,
      },
    };
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryAirportPickupData = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) {
    return {
      pickups: [],
      board: [],
      arrivalTimeline: [],
      needsAttention: [],
      stats: { total: 0, scheduled: 0, pending: 0, conflicts: 0 },
    };
  }

  await client.connect();
  try {
    const pickupResult = await client.query(
      `
        select
          source_id,
          tenant_id,
          booking_id,
          driver_id,
          guest_name,
          airport_code,
          flight_number,
          pickup_date_time,
          destination_label,
          assigned_tour_title,
          driver_name,
          vehicle_label,
          guest_count,
          status,
          notes,
          source_payload
        from public.airport_pickup_records
        where tenant_id = $1
        order by pickup_date_time asc nulls last, updated_at desc
      `,
      [tenantId]
    );
    const driverResult = await client.query(
      `
        select
          source_id,
          tenant_id,
          assigned_booking_id,
          staff_type,
          full_name,
          phone,
          email,
          home_base,
          availability_status,
          coalesce(
            (
              select array_agg(value order by value)
              from jsonb_array_elements_text(languages) value
            ),
            array[]::text[]
          ) as languages,
          coalesce(
            (
              select array_agg(value order by value)
              from jsonb_array_elements_text(specialties) value
            ),
            array[]::text[]
          ) as specialties,
          assigned_tour_title,
          assignment_date,
          assignment_start_date,
          assignment_end_date,
          assignment_notes,
          license_category,
          source_payload
        from public.guide_driver_assignment_records
        where tenant_id = $1 and staff_type = 'driver'
        order by full_name asc
      `,
      [tenantId]
    );
    const bookings = await queryPrimaryOperationsBookings(client, tenantId);

    const drivers = normalizePrimaryGuideDriverRows(driverResult.rows);
    const pickups = enrichAirportPickups(normalizePrimaryAirportPickupRows(pickupResult.rows), drivers);

    return {
      pickups,
      board: buildAirportPickupDashboard(bookings, pickups),
      arrivalTimeline: buildAirportArrivalTimeline(pickups),
      needsAttention: pickups.filter(
        (pickup) =>
          pickup.status !== "cancelled" &&
          ((pickup.conflictCount || 0) > 0 ||
            (pickup.status === "scheduled" && !pickup.lastDriverBriefSharedAt))
      ),
      stats: {
        total: pickups.length,
        scheduled: pickups.filter((pickup) => pickup.status === "scheduled").length,
        pending: pickups.filter((pickup) => pickup.status === "pending").length,
        conflicts: pickups.filter((pickup) => pickup.conflictCount > 0).length,
      },
    };
  } finally {
    await client.end().catch(() => {});
  }
};
