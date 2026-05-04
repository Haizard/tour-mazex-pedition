import express from "express";
import { requirePublicApiKey } from "../middleware/apiKeyMiddleware.js";
import Tour from "../models/Tour.js";
import { createTravelerInquiry } from "../utils/postgresFirstTravelerService.js";
import { findBookingRevenueRecord, findPaymentRevenueRecord } from "../utils/postgresRevenueRecords.js";
import { findMediaAssetRecord } from "../utils/postgresMediaRecords.js";
import { getSignedUrlForKey } from "../utils/objectStorage.js";

const router = express.Router();

// All routes in this file require a valid API Key
router.use(requirePublicApiKey);

/**
 * GET /api/public/v1/tours
 * List all active tours for the tenant.
 * 
 * [SKILL: Distribution API Design]
 */
router.get("/tours", async (req, res) => {
  try {
    const tours = await Tour.find({ 
      tenantId: req.tenantId,
      status: "active" 
    })
    .select("title slug description price currency duration images difficulty")
    .lean();

    res.status(200).json({
      count: tours.length,
      tours: tours.map(t => ({
        id: t._id,
        title: t.title,
        slug: t.slug,
        price: t.price,
        currency: t.currency,
        duration: t.duration,
        image: t.images?.[0] || null,
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tours." });
  }
});

/**
 * POST /api/public/v1/inquiry
 * Create a new inquiry via the public API.
 * Uses PostgreSQL-first service for transactional integrity.
 * 
 * [SKILL: Transactional Data Flow]
 */
router.post("/inquiry", async (req, res) => {
  const { name, email, phone, tourId, message, adults, children, travelDate } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and Email are required." });
  }

  try {
    // We use the PostgreSQL-first service to ensure the inquiry is recorded 
    // in the primary system of record.
    const result = await createTravelerInquiry({
      tenantId: req.tenantId,
      name,
      email,
      phone,
      tourId,
      message,
      adults: Number(adults || 1),
      children: Number(children || 0),
      travelWhen: travelDate,
      source: "public_api"
    }, req.tenantId, process.env);

    res.status(201).json({
      message: "Inquiry created successfully.",
      inquiryId: result.postgresId || result.mongoId
    });
  } catch (error) {
    console.error("Public API Inquiry Error:", error);
    res.status(500).json({ message: "Failed to create inquiry." });
  }
});

/**
 * GET /api/public/v1/booking/:id/itinerary
 * Get a signed URL for a booking's itinerary PDF.
 * 
 * [SKILL: Secure Artifact Delivery]
 */
router.get("/booking/:id/itinerary", async (req, res) => {
  try {
    const booking = await findBookingRevenueRecord(req.params.id, req.tenantId, process.env);
    if (!booking || !booking.itinerary_media_id) {
      return res.status(404).json({ message: "Itinerary not found for this booking." });
    }

    const media = await findMediaAssetRecord(booking.itinerary_media_id, req.tenantId, process.env);
    if (!media) {
      return res.status(404).json({ message: "Itinerary media asset not found." });
    }

    if (media.storage_provider === "s3-compatible") {
      const signedUrl = await getSignedUrlForKey({
        bucket: media.storage_bucket,
        key: media.storage_key,
        env: process.env
      });
      return res.status(200).json({ url: signedUrl });
    }

    res.status(200).json({ 
      url: media.public_url || `/api/media/${media.source_id}`,
      note: "Asset stored in fallback storage."
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve itinerary." });
  }
});

/**
 * GET /api/public/v1/payment/:id/invoice
 * Get a signed URL for a payment's invoice PDF.
 * 
 * [SKILL: Secure Artifact Delivery]
 */
router.get("/payment/:id/invoice", async (req, res) => {
  try {
    const payment = await findPaymentRevenueRecord(req.params.id, req.tenantId, process.env);
    if (!payment || !payment.invoice_media_id) {
      return res.status(404).json({ message: "Invoice not found for this payment." });
    }

    const media = await findMediaAssetRecord(payment.invoice_media_id, req.tenantId, process.env);
    if (!media) {
      return res.status(404).json({ message: "Invoice media asset not found." });
    }

    if (media.storage_provider === "s3-compatible") {
      const signedUrl = await getSignedUrlForKey({
        bucket: media.storage_bucket,
        key: media.storage_key,
        env: process.env
      });
      return res.status(200).json({ url: signedUrl });
    }

    res.status(200).json({ 
      url: media.public_url || `/api/media/${media.source_id}`,
      note: "Asset stored in fallback storage."
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve invoice." });
  }
});

export default router;
