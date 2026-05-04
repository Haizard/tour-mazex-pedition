import express from "express";
import process from "node:process";
import { verifyTravelerPortalToken } from "../utils/travelerPortalTokens.js";
import { createPostgresClient } from "../utils/postgresClient.js";

const router = express.Router();

// ── GET /api/traveler-portal/trip/:token ─────────────────────────────────────
// Public (token-authenticated) — no session/admin required.
// Returns the traveler's full trip details from PostgreSQL read models.
router.get("/trip/:token", async (req, res) => {
  const { token } = req.params;

  // 1. Verify the portal token
  const tokenResult = verifyTravelerPortalToken(token, process.env);
  if (!tokenResult.valid) {
    return res.status(401).json({
      error: "Access denied",
      reason: tokenResult.reason,
      message: "This trip link is invalid or has expired. Please request a new link from your tour operator.",
    });
  }

  const { bid: bookingId, tid: tenantId } = tokenResult.payload;

  // 2. Fetch booking data from PostgreSQL
  const client = createPostgresClient(process.env);
  if (!client) {
    return res.status(503).json({ error: "Data service temporarily unavailable." });
  }

  try {
    await client.connect();

    // Core booking record
    const bookingResult = await client.query(`
      select
        b.source_id,
        b.tenant_id,
        b.booking_reference,
        b.traveler_name,
        b.traveler_email,
        b.tour_name,
        b.start_date,
        b.end_date,
        b.total_price,
        b.currency,
        b.party_size,
        b.revenue_stage,
        b.booking_notes,
        b.created_at,
        b.updated_at
      from public.booking_lifecycle_records b
      where b.source_id = $1 and b.tenant_id = $2
      limit 1
    `, [bookingId, tenantId]);

    if (!bookingResult.rows.length) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const booking = bookingResult.rows[0];

    // Revenue / payment status
    const paymentResult = await client.query(`
      select
        payment_status,
        amount_paid,
        currency,
        payment_method,
        paid_at
      from public.revenue_records
      where booking_id = $1 and tenant_id = $2
      order by created_at desc
      limit 1
    `, [bookingId, tenantId]).catch(() => ({ rows: [] }));

    const payment = paymentResult.rows[0] || null;

    // Operations assignments (guide, driver, accommodation, pickup)
    const opsResult = await client.query(`
      select
        record_type,
        resource_name,
        assignment_date,
        notes,
        status
      from public.operations_records
      where booking_id = $1 and tenant_id = $2
      order by assignment_date asc
    `, [bookingId, tenantId]).catch(() => ({ rows: [] }));

    const operations = opsResult.rows || [];

    // Assemble the portal response
    res.status(200).json({
      portalVersion: "1.0",
      booking: {
        reference: booking.booking_reference || booking.source_id,
        travelerName: booking.traveler_name,
        tourName: booking.tour_name,
        startDate: booking.start_date,
        endDate: booking.end_date,
        totalPrice: Number(booking.total_price || 0),
        currency: booking.currency || "USD",
        partySize: Number(booking.party_size || 1),
        status: booking.revenue_stage || "confirmed",
        notes: booking.booking_notes || "",
        bookedAt: booking.created_at,
      },
      payment: payment ? {
        status: payment.payment_status,
        amountPaid: Number(payment.amount_paid || 0),
        currency: payment.currency || "USD",
        method: payment.payment_method,
        paidAt: payment.paid_at,
      } : null,
      itinerary: operations.map(op => ({
        type: op.record_type,
        resourceName: op.resource_name,
        date: op.assignment_date,
        status: op.status,
        notes: op.notes || "",
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load trip details.", message: error.message });
  } finally {
    await client.end().catch(() => {});
  }
});

// ── POST /api/traveler-portal/issue-token ─────────────────────────────────────
// Admin-only: issue a portal access token for a booking.
// Called by the admin dashboard "Send Trip Link" action.
router.post("/issue-token", async (req, res) => {
  try {
    const { issueTravelerPortalToken } = await import("../utils/travelerPortalTokens.js");
    const { bookingId, tenantId, travelerEmail } = req.body;

    if (!bookingId || !tenantId) {
      return res.status(400).json({ error: "bookingId and tenantId are required." });
    }

    const token = issueTravelerPortalToken(
      { bookingId: String(bookingId), tenantId: String(tenantId), travelerEmail: String(travelerEmail || "") },
      process.env
    );

    const portalUrl = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"] || req.headers.host}/trip/${token}`;

    res.status(200).json({
      token,
      portalUrl,
      expiresIn: "72 hours",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to issue portal token.", message: error.message });
  }
});

export default router;
