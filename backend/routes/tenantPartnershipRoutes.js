import express from "express";
import process from "node:process";
import TenantPropertyPartnership from "../models/TenantPropertyPartnership.js";
import Restaurant from "../models/Restaurant.js";
import Hotel from "../models/Hotel.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import { fetchCommissionReport } from "../utils/commissionReport.js";
import {
  createPostgresFirstTenantPropertyPartnership,
  updatePostgresFirstTenantPropertyPartnership,
  deletePostgresFirstTenantPropertyPartnership,
} from "../utils/postgresFirstTenantPropertyPartnershipService.js";

const router = express.Router();

const shapePartnership = (partnership = {}) => ({
  id: String(partnership._id || ""),
  tenantId: partnership.tenantId ? String(partnership.tenantId) : "",
  propertyId: partnership.propertyId ? String(partnership.propertyId) : "",
  propertyType: partnership.propertyType || "",
  propertyName: partnership.propertyName || "",
  propertySlug: partnership.propertySlug || "",
  ownerTenantId: partnership.ownerTenantId ? String(partnership.ownerTenantId) : "",
  commissionPercent: Number(partnership.commissionPercent || 0),
  status: partnership.status || "active",
  dealNotes: partnership.dealNotes || "",
  createdAt: partnership.createdAt || null,
  updatedAt: partnership.updatedAt || null,
});

// ── Public: Get all properties a tenant is partnered with ────────────────────

router.get("/public", async (req, res) => {
  try {
    if (!req.tenantId) {
      return res.status(200).json({ properties: [] });
    }

    const partnerships = await TenantPropertyPartnership.find({
      tenantId: req.tenantId,
      status: "active",
    }).lean();

    const restaurantIds = partnerships
      .filter((p) => p.propertyType === "restaurant")
      .map((p) => p.propertyId);
    const hotelIds = partnerships
      .filter((p) => p.propertyType === "hotel")
      .map((p) => p.propertyId);

    const [restaurants, hotels] = await Promise.all([
      restaurantIds.length
        ? Restaurant.find({
            _id: { $in: restaurantIds },
            published: true,
            marketplaceVisible: true,
          }).lean()
        : Promise.resolve([]),
      hotelIds.length
        ? Hotel.find({
            _id: { $in: hotelIds },
            published: true,
            marketplaceVisible: true,
          }).lean()
        : Promise.resolve([]),
    ]);

    const restaurantMap = new Map(restaurants.map((r) => [String(r._id), r]));
    const hotelMap = new Map(hotels.map((h) => [String(h._id), h]));

    const properties = partnerships.map((p) => {
      const prop =
        p.propertyType === "restaurant"
          ? restaurantMap.get(String(p.propertyId))
          : hotelMap.get(String(p.propertyId));

      return {
        ...shapePartnership(p),
        property: prop || null,
      };
    });

    return res.status(200).json({ properties });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch partnered properties.",
      error: error.message,
    });
  }
});

// ── Public: Get property IDs the current tenant is partnered with ────────────

router.get("/public/ids", async (req, res) => {
  try {
    if (!req.tenantId) {
      return res.status(200).json({
        restaurantIds: [],
        hotelIds: [],
        partnerships: [],
        hasTenantContext: false,
      });
    }

    const partnerships = await TenantPropertyPartnership.find({
      tenantId: req.tenantId,
      status: "active",
    }).lean();

    return res.status(200).json({
      restaurantIds: partnerships
        .filter((p) => p.propertyType === "restaurant")
        .map((p) => String(p.propertyId)),
      hotelIds: partnerships
        .filter((p) => p.propertyType === "hotel")
        .map((p) => String(p.propertyId)),
      partnerships: partnerships.map(shapePartnership),
      hasTenantContext: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch partnership IDs.",
      error: error.message,
    });
  }
});

// ── Protected: Tenant admin CRUD ────────────────────────────────────────────

router.use(requireTenantAdmin);

router.get("/commission-report", async (req, res) => {
  try {
    const report = await fetchCommissionReport(
      String(req.tenantId || ""),
      process.env
    );
    return res.status(200).json(report);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch commission report.",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const partnerships = await TenantPropertyPartnership.find(
      buildTenantFilter(req)
    )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(partnerships.map(shapePartnership));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch partnerships.",
      error: error.message,
    });
  }
});

router.get("/available", async (req, res) => {
  try {
    const propertyType = String(req.query.propertyType || "restaurant").trim();
    const search = String(req.query.q || "").trim().toLowerCase();

    const existingPartnerships = await TenantPropertyPartnership.find(
      buildTenantFilter(req)
    )
      .select("propertyId propertyType")
      .lean();

    const existingPropertyIds = existingPartnerships
      .filter((p) => p.propertyType === propertyType)
      .map((p) => p.propertyId);

    let available = [];
    if (propertyType === "restaurant") {
      const query = {
        published: true,
        marketplaceVisible: true,
        _id: { $nin: existingPropertyIds },
      };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { destination: { $regex: search, $options: "i" } },
        ];
      }
      available = await Restaurant.find(query)
        .select("name slug destination region cuisineTypes summary photos averageRating reviewCount")
        .sort({ name: 1 })
        .limit(20)
        .lean();
    } else if (propertyType === "hotel") {
      const query = {
        published: true,
        marketplaceVisible: true,
        _id: { $nin: existingPropertyIds },
      };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { destination: { $regex: search, $options: "i" } },
        ];
      }
      available = await Hotel.find(query)
        .select("name slug destination region accommodationType amenities summary photos averageRating reviewCount")
        .sort({ name: 1 })
        .limit(20)
        .lean();
    }

    return res.status(200).json({ properties: available });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch available properties.",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const propertyId = String(req.body.propertyId || "").trim();
    const propertyType = String(req.body.propertyType || "").trim();
    const commissionPercent = Number(req.body.commissionPercent || 0);
    const dealNotes = String(req.body.dealNotes || "").trim();

    if (!propertyId || !["restaurant", "hotel"].includes(propertyType)) {
      return res.status(400).json({
        message: "Property ID and type (restaurant or hotel) are required.",
      });
    }

    // Verify the property exists and is published
    let property = null;
    if (propertyType === "restaurant") {
      property = await Restaurant.findById(propertyId)
        .select("name slug tenantId")
        .lean();
    } else {
      property = await Hotel.findById(propertyId)
        .select("name slug tenantId")
        .lean();
    }

    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Check for duplicate
    const existing = await TenantPropertyPartnership.findOne(
      buildTenantFilter(req, { propertyId, propertyType })
    );
    if (existing) {
      return res.status(409).json({
        message: "A partnership with this property already exists.",
      });
    }

    const partnership = await createPostgresFirstTenantPropertyPartnership(
      withTenantId(req, {
        propertyId,
        propertyType,
        propertyName: property.name || "",
        propertySlug: property.slug || "",
        ownerTenantId: property.tenantId || null,
        commissionPercent,
        status: "active",
        dealNotes,
      }),
      process.env
    );

    return res.status(201).json(shapePartnership(partnership.toObject()));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const partnership = await TenantPropertyPartnership.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    );

    if (!partnership) {
      return res.status(404).json({ message: "Partnership not found." });
    }

    const updates = {};
    if (req.body.commissionPercent !== undefined) {
      updates.commissionPercent = Number(req.body.commissionPercent);
    }
    if (req.body.status) {
      updates.status = String(req.body.status).trim();
    }
    if (req.body.dealNotes !== undefined) {
      updates.dealNotes = String(req.body.dealNotes).trim();
    }
    const updatedPartnership = await updatePostgresFirstTenantPropertyPartnership(
      req.params.id,
      req.tenantId,
      updates,
      process.env
    );

    return res.status(200).json(shapePartnership(updatedPartnership));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const partnership = await deletePostgresFirstTenantPropertyPartnership(
      req.params.id,
      req.tenantId,
      process.env
    );

    if (!partnership) {
      return res.status(404).json({ message: "Partnership not found." });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
