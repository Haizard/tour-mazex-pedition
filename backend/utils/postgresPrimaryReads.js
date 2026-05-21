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
import { summarizePartnerAccount } from "./partnerPortal.js";
import { summarizeCompetitorInsight } from "./competitorIntelligence.js";
import { summarizeLanguageAssistantProfile } from "./languageAssistant.js";
import { summarizeTravelDocumentationGuide } from "./travelDocumentationAssistant.js";

const toNumber = (value, fallback = 0) =>
  value === null || value === undefined || value === "" ? fallback : Number(value);

const toIso = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

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
            packageTour: String(row.booking_package_tour || ""),
            status: String(row.booking_status || ""),
            revenueStage: String(row.booking_revenue_stage || ""),
            paymentStatus: String(row.booking_payment_status || ""),
            quoteProposalId: row.booking_quote_proposal_id
              ? String(row.booking_quote_proposal_id)
              : null,
          }
        : null,
      quoteProposal: row.booking_quote_proposal_id
        ? {
            _id: String(row.booking_quote_proposal_id),
            title: String(row.quote_title || ""),
            status: String(row.quote_status || ""),
            conversionStage: String(row.quote_conversion_stage || ""),
            paymentStatus: String(row.quote_payment_status || ""),
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
      hotelId: payload.hotelId ? String(payload.hotelId) : "",
      hotelName: String(payload.hotelName || ""),
      hotelIntentType: String(payload.hotelIntentType || ""),
      message: String(payload.message || ""),
      contactPreference: String(payload.contactPreference || "whatsapp"),
      followUpMessage: String(payload.followUpMessage || ""),
      automationSummary: String(payload.automationSummary || ""),
    };
  });

export const normalizePrimaryQuoteRows = (rows = []) =>
  rows.map((row = {}) => {
    const payload = row.source_payload || {};
    return {
      ...payload,
      _id: String(row.source_id || payload._id || ""),
      tenantId: String(row.tenant_id || payload.tenantId || ""),
      inquiryId: row.inquiry_id ? String(row.inquiry_id) : payload.inquiryId || null,
      bookingId: row.booking_id ? String(row.booking_id) : payload.bookingId || null,
      title: String(row.title || payload.title || ""),
      travelerName: String(row.traveler_name || payload.travelerName || ""),
      status: String(row.status || payload.status || "draft"),
      conversionStage: String(row.conversion_stage || payload.conversionStage || "draft"),
      paymentStatus: String(row.payment_status || payload.paymentStatus || "not-started"),
      currency: String(row.currency || payload.currency || "USD"),
      totalPrice: Number(row.total_price ?? payload.totalPrice ?? 0),
      publicToken: String(row.public_token || payload.publicToken || ""),
      validUntil: toIso(row.valid_until || payload.validUntil),
      sentAt: toIso(row.sent_at || payload.sentAt),
      acceptedAt: toIso(row.accepted_at || payload.acceptedAt),
      travelerCount: Number(payload.travelerCount || 0),
      tripLengthDays: Number(payload.tripLengthDays || 0),
      itineraryOutline: Array.isArray(payload.itineraryOutline) ? payload.itineraryOutline : [],
      nextSteps: Array.isArray(payload.nextSteps) ? payload.nextSteps : [],
      lineItems: Array.isArray(payload.lineItems) ? payload.lineItems : [],
    };
  });

export const normalizePrimaryBookingRows = (rows = []) =>
  rows.map((row = {}) => {
    const payload = row.source_payload || {};
    const createdAt = toIso(row.created_at || payload.createdAt || payload.date);
    const updatedAt = toIso(row.updated_at || payload.updatedAt);

    return {
      ...payload,
      _id: String(row.source_id || payload._id || ""),
      tenantId: String(row.tenant_id || payload.tenantId || ""),
      quoteProposalId: row.quote_proposal_id
        ? String(row.quote_proposal_id)
        : payload.quoteProposalId
          ? String(payload.quoteProposalId)
          : null,
      name: String(row.traveler_name || payload.name || ""),
      email: String(row.email || payload.email || ""),
      phone: String(row.phone || payload.phone || ""),
      address: String(row.address || payload.address || ""),
      packageTour: String(row.package_tour || payload.packageTour || ""),
      status: String(row.status || payload.status || "Pending"),
      revenueStage: String(row.revenue_stage || payload.revenueStage || "new"),
      paymentStatus: String(row.payment_status || payload.paymentStatus || "not-started"),
      totalPrice: toNumber(row.total_price ?? payload.totalPrice),
      currency: String(row.currency || payload.currency || "USD"),
      referralCode: String(row.referral_code || payload.referralCode || ""),
      leadSource: String(row.lead_source || payload.leadSource || "website"),
      campaignLabel: String(row.campaign_label || payload.campaignLabel || ""),
      firstTouchAt: toIso(row.first_touch_at || payload.firstTouchAt),
      convertedAt: toIso(row.converted_at || payload.convertedAt),
      travelDate: toIso(row.travel_date || payload.travelDate),
      paymentUpdatedAt: toIso(payload.paymentUpdatedAt),
      bookingDate: toIso(payload.bookingDate || payload.date || createdAt),
      createdAt,
      updatedAt,
      pax: toNumber(payload.pax, 1),
      adults: toNumber(payload.adults, 1),
      children: toNumber(payload.children, 0),
      notes: String(payload.notes || ""),
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

export const buildPrimaryGuideDriverTeam = (team = []) =>
  (team || []).map((member) => ({
    ...member,
    assignmentSummary: summarizeGuideDriverAssignment(member),
    notificationReady: Boolean(member.availabilityStatus === "assigned" && member.assignedBookingId),
  }));

export const normalizePrimaryAccommodationRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    bookingId: row.booking_id ? String(row.booking_id) : "",
    hotelId: row.hotel_id ? String(row.hotel_id) : "",
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

export const normalizePrimaryPartnerRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    partnerType: String(row.partner_type || "hotel"),
    companyName: String(row.company_name || ""),
    contactName: String(row.contact_name || ""),
    email: String(row.email || ""),
    phone: String(row.phone || ""),
    location: String(row.location || ""),
    serviceFocus: String(row.service_focus || ""),
    contractLabel: String(row.contract_label || ""),
    payoutTerms: String(row.payout_terms || ""),
    notes: String(row.notes || ""),
    status: String(row.status || "pending"),
  }));

export const normalizePrimaryCompetitorRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    competitorName: String(row.competitor_name || ""),
    marketRegion: String(row.market_region || ""),
    focusRoute: String(row.focus_route || ""),
    observedPriceUsd:
      row.observed_price_usd === null || row.observed_price_usd === undefined
        ? null
        : Number(row.observed_price_usd || 0),
    currency: String(row.currency || "USD"),
    marketTrend: String(row.market_trend || ""),
    offerSummary: String(row.offer_summary || ""),
    sourceLabel: String(row.source_label || ""),
    intelligenceDate: toIso(row.intelligence_date),
    strengthSignals: Array.isArray(row.strength_signals) ? row.strength_signals : [],
    riskSignals: Array.isArray(row.risk_signals) ? row.risk_signals : [],
    status: String(row.status || "watchlist"),
    notes: String(row.notes || ""),
  }));

export const normalizePrimaryLanguageAssistantRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    language: String(row.language || ""),
    localeCode: String(row.locale_code || ""),
    tone: String(row.tone || ""),
    useCases: Array.isArray(row.use_cases) ? row.use_cases : [],
    glossary: Array.isArray(row.glossary) ? row.glossary : [],
    status: String(row.status || "draft"),
    notes: String(row.notes || ""),
  }));

export const normalizePrimaryTravelDocumentationRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    market: String(row.market || ""),
    topic: String(row.topic || ""),
    requirementSummary: String(row.requirement_summary || ""),
    sourceLabel: String(row.source_label || ""),
    lastReviewedAt: toIso(row.last_reviewed_at),
    status: String(row.status || "draft"),
    notes: String(row.notes || ""),
  }));

export const normalizePrimaryReviewRequestRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    bookingId: String(row.booking_id || ""),
    guestName: String(row.guest_name || ""),
    guestEmail: String(row.guest_email || ""),
    bookingLabel: String(row.booking_label || ""),
    subject: String(row.subject || ""),
    message: String(row.message || ""),
    status: String(row.status || "draft"),
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    sendWindowLabel: String(row.send_window_label || ""),
    nextStepChecklist: Array.isArray(row.next_step_checklist) ? row.next_step_checklist : [],
    sentAt: toIso(row.sent_at),
    completedAt: toIso(row.completed_at),
  }));

export const normalizePrimaryRepeatCustomerCampaignRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    bookingId: String(row.booking_id || ""),
    guestName: String(row.guest_name || ""),
    guestEmail: String(row.guest_email || ""),
    bookingLabel: String(row.booking_label || ""),
    campaignType: String(row.campaign_type || "referral"),
    audienceTag: String(row.audience_tag || ""),
    segment: String(row.segment || "First-Timer"),
    channel: String(row.channel || "email"),
    offerLabel: String(row.offer_label || ""),
    subject: String(row.subject || ""),
    message: String(row.message || ""),
    status: String(row.status || "draft"),
    recommendedSendAtLabel: String(row.recommended_send_at_label || ""),
    nextStepChecklist: Array.isArray(row.next_step_checklist) ? row.next_step_checklist : [],
    sentAt: toIso(row.sent_at),
    convertedAt: toIso(row.converted_at),
  }));

export const normalizePrimaryTravelerFeedbackRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    bookingId: row.booking_id
      ? {
          _id: String(row.booking_id),
          name: String(row.booking_name || ""),
        }
      : null,
    rating:
      row.rating === null || row.rating === undefined ? null : Number(row.rating || 0),
    privateNote: String(row.private_note || ""),
    publicReview: String(row.public_review || ""),
    publicToken: String(row.public_token || ""),
    referralCode: String(row.referral_code || ""),
    status: String(row.status || "pending"),
    submittedAt: toIso(row.submitted_at),
    aiSentiment: String(row.ai_sentiment || ""),
    aiScore:
      row.ai_score === null || row.ai_score === undefined ? null : Number(row.ai_score || 0),
    aiSummary: String(row.ai_summary || ""),
    aiKeyTopics: Array.isArray(row.ai_key_topics) ? row.ai_key_topics : [],
    aiImprovementSuggestion: String(row.ai_improvement_suggestion || ""),
  }));

export const normalizePrimaryLeadFollowUpSequenceRows = (rows = []) =>
  rows.map((row = {}) => ({
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    inquiryId: row.inquiry_id ? String(row.inquiry_id) : null,
    bookingId: row.booking_id ? String(row.booking_id) : null,
    status: String(row.status || "active"),
    touchpoints: Array.isArray(row.touchpoints)
      ? row.touchpoints.map((touchpoint = {}) => ({
          ...touchpoint,
          scheduledAt: toIso(touchpoint.scheduledAt || touchpoint.scheduled_at),
          sentAt: toIso(touchpoint.sentAt || touchpoint.sent_at),
        }))
      : [],
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
          br.package_tour as booking_package_tour,
          br.status as booking_status,
          br.revenue_stage as booking_revenue_stage,
          br.payment_status as booking_payment_status,
          br.quote_proposal_id as booking_quote_proposal_id,
          qr.title as quote_title,
          qr.status as quote_status,
          qr.conversion_stage as quote_conversion_stage,
          qr.payment_status as quote_payment_status
        from public.payment_records pr
        left join public.booking_records br
          on br.source_id = pr.booking_id and br.tenant_id = pr.tenant_id
        left join public.quote_records qr
          on qr.source_id = br.quote_proposal_id and qr.tenant_id = pr.tenant_id
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

export const fetchPrimaryBookings = async (tenantId = "", env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          quote_proposal_id,
          traveler_name,
          email,
          phone,
          package_tour,
          status,
          revenue_stage,
          payment_status,
          total_price,
          currency,
          referral_code,
          lead_source,
          campaign_label,
          first_touch_at,
          converted_at,
          travel_date,
          source_payload,
          created_at,
          updated_at
        from public.booking_records
        where tenant_id = $1
        order by updated_at desc
      `,
      [tenantId]
    );
    return normalizePrimaryBookingRows(result.rows);
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

export const fetchPrimaryInquiryQuotes = async (
  inquiryId = "",
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          inquiry_id,
          booking_id,
          title,
          traveler_name,
          status,
          conversion_stage,
          payment_status,
          currency,
          total_price,
          public_token,
          valid_until,
          sent_at,
          accepted_at,
          source_payload
        from public.quote_records
        where tenant_id = $1 and inquiry_id = $2
        order by updated_at desc
      `,
      [tenantId, inquiryId]
    );
    return normalizePrimaryQuoteRows(result.rows);
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

    const team = buildPrimaryGuideDriverTeam(normalizePrimaryGuideDriverRows(teamResult.rows));

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
          hotel_id,
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

export const fetchPrimaryPartnerAccounts = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          partner_type,
          company_name,
          contact_name,
          email,
          phone,
          location,
          service_focus,
          contract_label,
          payout_terms,
          notes,
          status
        from public.partner_account_records
        where tenant_id = $1
        order by partner_type asc, company_name asc
      `,
      [tenantId]
    );

    return normalizePrimaryPartnerRows(result.rows).map((partner) => ({
      ...partner,
      partnerSummary: summarizePartnerAccount(partner),
    }));
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryCompetitorInsights = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          competitor_name,
          market_region,
          focus_route,
          observed_price_usd,
          currency,
          market_trend,
          offer_summary,
          source_label,
          intelligence_date,
          coalesce(
            (
              select array_agg(value order by value)
              from jsonb_array_elements_text(strength_signals) value
            ),
            array[]::text[]
          ) as strength_signals,
          coalesce(
            (
              select array_agg(value order by value)
              from jsonb_array_elements_text(risk_signals) value
            ),
            array[]::text[]
          ) as risk_signals,
          status,
          notes
        from public.competitor_insight_records
        where tenant_id = $1
        order by updated_at desc
      `,
      [tenantId]
    );

    return normalizePrimaryCompetitorRows(result.rows).map((insight) => ({
      ...insight,
      intelligenceSummary: summarizeCompetitorInsight(insight),
    }));
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryLanguageAssistantProfiles = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          language,
          locale_code,
          tone,
          coalesce(
            (
              select array_agg(value order by value)
              from jsonb_array_elements_text(use_cases) value
            ),
            array[]::text[]
          ) as use_cases,
          coalesce(
            (
              select array_agg(value order by value)
              from jsonb_array_elements_text(glossary) value
            ),
            array[]::text[]
          ) as glossary,
          status,
          notes
        from public.language_assistant_profile_records
        where tenant_id = $1
        order by language asc
      `,
      [tenantId]
    );

    return normalizePrimaryLanguageAssistantRows(result.rows).map((profile) => ({
      ...profile,
      profileSummary: summarizeLanguageAssistantProfile(profile),
    }));
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryTravelDocumentationGuides = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          market,
          topic,
          requirement_summary,
          source_label,
          last_reviewed_at,
          status,
          notes
        from public.travel_documentation_guide_records
        where tenant_id = $1
        order by market asc, topic asc
      `,
      [tenantId]
    );

    return normalizePrimaryTravelDocumentationRows(result.rows).map((guide) => ({
      ...guide,
      guideSummary: summarizeTravelDocumentationGuide(guide),
    }));
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryReviewRequests = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          booking_id,
          guest_name,
          guest_email,
          booking_label,
          subject,
          message,
          status,
          platforms,
          send_window_label,
          next_step_checklist,
          sent_at,
          completed_at
        from public.review_request_records
        where tenant_id = $1
        order by updated_at desc
      `,
      [tenantId]
    );

    return normalizePrimaryReviewRequestRows(result.rows);
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryRepeatCustomerCampaigns = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          booking_id,
          guest_name,
          guest_email,
          booking_label,
          campaign_type,
          audience_tag,
          segment,
          channel,
          offer_label,
          subject,
          message,
          status,
          recommended_send_at_label,
          next_step_checklist,
          sent_at,
          converted_at
        from public.repeat_customer_campaign_records
        where tenant_id = $1
        order by updated_at desc
      `,
      [tenantId]
    );

    return normalizePrimaryRepeatCustomerCampaignRows(result.rows);
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryTravelerFeedback = async (
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) return [];
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          fr.source_id,
          fr.tenant_id,
          fr.booking_id,
          fr.rating,
          fr.private_note,
          fr.public_review,
          fr.public_token,
          fr.referral_code,
          fr.status,
          fr.submitted_at,
          fr.ai_sentiment,
          fr.ai_score,
          fr.ai_summary,
          fr.ai_key_topics,
          fr.ai_improvement_suggestion,
          br.traveler_name as booking_name
        from public.traveler_feedback_records fr
        left join public.booking_records br
          on br.source_id = fr.booking_id and br.tenant_id = fr.tenant_id
        where fr.tenant_id = $1
        order by fr.updated_at desc
      `,
      [tenantId]
    );

    return normalizePrimaryTravelerFeedbackRows(result.rows);
  } finally {
    await client.end().catch(() => {});
  }
};

export const fetchPrimaryLeadFollowUpSequence = async (
  inquiryId = "",
  tenantId = "",
  env = globalThis.process?.env || {}
) => {
  const client = createPostgresClient(env);
  if (!client) return null;
  await client.connect();
  try {
    const result = await client.query(
      `
        select
          source_id,
          tenant_id,
          inquiry_id,
          booking_id,
          status,
          touchpoints
        from public.lead_follow_up_sequence_records
        where tenant_id = $1 and inquiry_id = $2
        order by updated_at desc
        limit 1
      `,
      [tenantId, inquiryId]
    );

    return normalizePrimaryLeadFollowUpSequenceRows(result.rows)[0] || null;
  } finally {
    await client.end().catch(() => {});
  }
};
