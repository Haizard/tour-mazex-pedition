import express from "express";
import process from "node:process";
import Hotel from "../models/Hotel.js";
import HotelPartnerAdmin from "../models/HotelPartnerAdmin.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { hashAdminPassword } from "../utils/adminAuth.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import { buildHotelPartnerAdminAccountPayload } from "../utils/hotelPartnerAccess.js";
import {
  buildHotelDiscoveryQuery,
  buildHotelSort,
  shapeHotelDetail,
  shapeHotelDiscoveryCard,
} from "../utils/hotelMarketplace.js";
import {
  buildHotelRecordView,
  deleteHotelRecord,
  findHotelRecord,
} from "../utils/postgresHotelRecords.js";
import {
  createPostgresFirstHotel,
  updatePostgresFirstHotel,
} from "../utils/postgresFirstHotelService.js";
import {
  deleteMongoDocumentFromShadowStore,
} from "../utils/postgresShadowWrites.js";

const router = express.Router();

const slugify = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toOptionalNumber = (value) => {
  if (value === null || value === "" || typeof value === "undefined") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeHotelPayload = (req, body = {}) => {
  const name = String(body.name || "").trim();
  if (!name) {
    throw new Error("Hotel name is required.");
  }

  const slug = slugify(body.slug || name);
  if (!slug) {
    throw new Error("Hotel slug is required.");
  }

  return withTenantId(req, {
    partnerAccountId: body.partnerAccountId || null,
    name,
    slug,
    summary: body.summary || "",
    description: body.description || "",
    destination: body.destination || "",
    region: body.region || "",
    geo: {
      latitude: toOptionalNumber(body.geo?.latitude),
      longitude: toOptionalNumber(body.geo?.longitude),
    },
    accommodationType: body.accommodationType || "hotel",
    amenities: Array.isArray(body.amenities) ? body.amenities : [],
    roomStyleSummary: body.roomStyleSummary || "",
    photos: Array.isArray(body.photos) ? body.photos : [],
    averageRating: body.averageRating === null || body.averageRating === "" ? null : Number(body.averageRating || 0),
    reviewCount: Number(body.reviewCount || 0),
    trustSummary: body.trustSummary || "",
    published: body.published === true,
    marketplaceVisible: body.marketplaceVisible === true,
    sponsoredPlacement: body.sponsoredPlacement === true,
    status: body.status || (body.published ? "active" : "draft"),
    sourceMeta: body.sourceMeta || {},
  });
};

router.get("/public", async (req, res) => {
  try {
    const query = buildHotelDiscoveryQuery(req.query);
    const hotels = await Hotel.find(query)
      .sort(buildHotelSort(req.query.sort))
      .populate("tenantId", "name slug")
      .lean();

    res.status(200).json({
      hotels: hotels.map(shapeHotelDiscoveryCard),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch hotels.", error: error.message });
  }
});

router.get("/public/:slug", async (req, res) => {
  try {
    const hotel = await Hotel.findOne({
      slug: req.params.slug,
      published: true,
      marketplaceVisible: true,
    })
      .populate("tenantId", "name slug")
      .lean();

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found in marketplace." });
    }

    return res.status(200).json(shapeHotelDetail(hotel));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch hotel.", error: error.message });
  }
});

router.use(requireTenantAdmin);

router.get("/", async (req, res) => {
  try {
    const hotels = await Hotel.find(buildTenantFilter(req)).sort({ sponsoredPlacement: -1, name: 1 }).lean();
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = normalizeHotelPayload(req, req.body);
    const hotel = await createPostgresFirstHotel(payload, process.env);
    const hotelRecord = await findHotelRecord(hotel._id, req.tenantId, process.env).catch(() => null);
    res.status(201).json(hotelRecord ? buildHotelRecordView(hotelRecord) : hotel.toObject?.() || hotel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const currentHotel = await Hotel.findOne(buildTenantFilter(req, { _id: req.params.id })).lean();

    if (!currentHotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    const payload = normalizeHotelPayload(req, {
      ...currentHotel,
      ...req.body,
    });
    delete payload.tenantId;

    const hotel = await updatePostgresFirstHotel(req.params.id, req.tenantId, payload, process.env);
    const hotelRecord = await findHotelRecord(hotel._id, req.tenantId, process.env).catch(() => null);
    res.status(200).json(hotelRecord ? buildHotelRecordView(hotelRecord) : hotel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/:id/partner-admins", async (req, res) => {
  try {
    const hotel = await Hotel.findOne(buildTenantFilter(req, { _id: req.params.id })).lean();

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    const payload = buildHotelPartnerAdminAccountPayload(req.body);
    const passwordRecord = await hashAdminPassword(payload.password);
    const partnerAdmin = await HotelPartnerAdmin.create({
      tenantId: req.tenantId,
      hotelIds: [hotel._id],
      username: payload.username,
      displayName: payload.displayName,
      role: payload.role,
      status: payload.status,
      ...passwordRecord,
    });

    return res.status(201).json({
      partnerAdmin: {
        id: partnerAdmin._id,
        username: partnerAdmin.username,
        displayName: partnerAdmin.displayName,
        role: partnerAdmin.role,
        status: partnerAdmin.status,
        hotelIds: partnerAdmin.hotelIds.map((hotelId) => String(hotelId)),
      },
    });
  } catch (error) {
    const duplicateMessage =
      error.code === 11000
        ? "A hotel partner admin with that username already exists for this tenant."
        : error.message;
    return res.status(400).json({ message: duplicateMessage });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findOneAndDelete(buildTenantFilter(req, { _id: req.params.id })).lean();

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    await deleteHotelRecord(hotel._id, hotel.tenantId).catch((error) => {
      console.error("Hotel record delete failed:", error.message);
    });
    await deleteMongoDocumentFromShadowStore({
      entityType: "hotels",
      sourceId: hotel._id,
    });

    return res.status(200).json({ message: "Hotel deleted." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
