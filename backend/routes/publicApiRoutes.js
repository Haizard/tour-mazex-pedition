import express from "express";
import process from "node:process";
import TourPackage from "../models/TourPackage.js";
import SiteSettings from "../models/SiteSettings.js";
import { requireApiKey, requireScope } from "../middleware/apiKeyAuthMiddleware.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import { scoreInquiryLead } from "../utils/leadScoring.js";
import { generateInquiryLeadAutomation } from "../utils/leadAutomation.js";
import { createPostgresFirstTraveler } from "../utils/postgresFirstTravelerService.js";

const router = express.Router();

// ── Status (public, no key required) ────────────────────────────────────────
router.get("/status", async (req, res) => {
  res.status(200).json({
    api: "MAZ Expeditions External API",
    version: "1.0",
    status: "operational",
    documentation: "https://mazexpeditions.com/api/v1/docs",
    timestamp: new Date().toISOString(),
  });
});

// All routes below require a valid API key ─────────────────────────────────
router.use(requireApiKey);

// ── Tour Catalog ─────────────────────────────────────────────────────────────
router.get("/tours", requireScope("tours:read"), async (req, res) => {
  try {
    const { search, type, maxPrice, limit = 20, page = 1 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safeSkip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }
    if (type) query.tourType = type;
    if (maxPrice) query.price = { $lte: Number(maxPrice) };

    const [tours, total] = await Promise.all([
      TourPackage.find(buildTenantFilter(req, query))
        .select("title location tourType category price duration description highlights image createdAt")
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      TourPackage.countDocuments(buildTenantFilter(req, query)),
    ]);

    res.status(200).json({
      data: tours.map((t) => ({
        id: t._id,
        title: t.title,
        location: t.location,
        tourType: t.tourType,
        category: t.category,
        price: t.price,
        duration: t.duration,
        description: t.description,
        highlights: t.highlights || [],
        image: t.image || null,
        bookingUrl: `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"] || req.headers.host}/plan-my-trip?tour=${encodeURIComponent(t.title)}`,
        createdAt: t.createdAt,
      })),
      pagination: {
        total,
        page: Math.max(Number(page) || 1, 1),
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// ── Single Tour ───────────────────────────────────────────────────────────────
router.get("/tours/:id", requireScope("tours:read"), async (req, res) => {
  try {
    const tour = await TourPackage.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!tour) {
      return res.status(404).json({ error: "Not Found", message: "Tour not found." });
    }

    const settings = await SiteSettings.findOne(buildTenantFilter(req))
      .select("whatsapp contactEmail")
      .lean();

    res.status(200).json({
      id: tour._id,
      title: tour.title,
      location: tour.location,
      tourType: tour.tourType,
      category: tour.category,
      price: tour.price,
      duration: tour.duration,
      description: tour.description,
      highlights: tour.highlights || [],
      inclusions: tour.inclusions || [],
      exclusions: tour.exclusions || [],
      itinerary: tour.itinerary || [],
      image: tour.image || null,
      images: tour.images || [],
      operator: {
        name: req.tenant?.name || "",
        whatsapp: settings?.whatsapp || "",
        contactEmail: settings?.contactEmail || "",
      },
      bookingUrl: `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"] || req.headers.host}/plan-my-trip?tour=${encodeURIComponent(tour.title)}`,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// ── Inquiry Submission ─────────────────────────────────────────────────────
router.post("/inquiries", requireScope("inquiries:write"), async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      destinations, tripLengthDays, adults,
      childrenUnder5 = 0, children6To15 = 0,
      travelWhen, budget, message,
      referralCode, campaignLabel,
    } = req.body;

    if (!firstName || !email || !phone) {
      return res.status(400).json({
        error: "Bad Request",
        message: "firstName, email, and phone are required.",
      });
    }

    const inquiryData = {
      firstName: String(firstName || ""),
      lastName: String(lastName || ""),
      name: `${firstName || ""} ${lastName || ""}`.trim(),
      email: String(email || ""),
      phone: String(phone || ""),
      destinations: Array.isArray(destinations) ? destinations : (destinations ? [destinations] : []),
      tripLengthDays: Number(tripLengthDays || 0),
      adults: Number(adults || 1),
      childrenUnder5: Number(childrenUnder5),
      children6To15: Number(children6To15),
      duration: tripLengthDays ? `${tripLengthDays} days` : undefined,
      travelWhen: String(travelWhen || ""),
      budget: String(budget || ""),
      message: String(message || ""),
      sourceChannel: "partner-api",
      campaignLabel: String(campaignLabel || "partner-api"),
      referralCode: String(referralCode || ""),
      firstTouchAt: new Date(),
    };

    const scoring = scoreInquiryLead(inquiryData);
    const automation = generateInquiryLeadAutomation(inquiryData, {
      tenantName: req.tenant?.name || "MAZ Expeditions",
      whatsappNumber: "",
    });

    const newInquiry = await createPostgresFirstTraveler(
      {
        ...inquiryData,
        ...scoring,
        tenantId: req.tenantId,
        automationSummary: automation.summary,
        followUpMessage: automation.followUpMessage,
      },
      process.env
    );

    res.status(201).json({
      id: newInquiry._id,
      status: "received",
      message: "Inquiry submitted successfully. The operator will be in touch shortly.",
      leadScore: scoring.leadScore,
      leadTemperature: scoring.leadTemperature,
      followUpMessage: automation.followUpMessage,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

export default router;
