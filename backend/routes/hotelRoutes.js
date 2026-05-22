import express from "express";
import process from "node:process";
import Hotel from "../models/Hotel.js";
import HotelClaimRequest from "../models/HotelClaimRequest.js";
import HotelPartnerAdmin from "../models/HotelPartnerAdmin.js";
import CustomInquiry from "../models/CustomInquiry.js";
import QuoteProposal from "../models/QuoteProposal.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { hashAdminPassword } from "../utils/adminAuth.js";
import { buildHotelAnalyticsSnapshot } from "../utils/hotelAnalytics.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import { buildHotelPartnerAdminAccountPayload } from "../utils/hotelPartnerAccess.js";
import {
  buildApprovedHotelPartnerAdminPayload,
  buildHotelClaimRequestPayload,
  buildHotelClaimReviewUpdate,
  shapeHotelClaimQueueItem,
} from "../utils/hotelClaimFlow.js";
import {
  buildHotelConciergeRecommendations,
  buildHotelDiscoveryQuery,
  buildHotelSort,
  shapeHotelDetail,
  shapeHotelDiscoveryCard,
} from "../utils/hotelMarketplace.js";
import { searchAssistantKnowledge } from "../utils/pgvectorRetrieval.js";
import {
  buildHotelRecordView,
  deleteHotelRecord,
  findHotelRecord,
} from "../utils/postgresHotelRecords.js";
import {
  createPostgresFirstHotel,
  updatePostgresFirstHotel,
} from "../utils/postgresFirstHotelService.js";
import { deleteHotelListingVector } from "../utils/postgresHotelVectorService.js";
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

router.post("/public/concierge/recommendations", async (req, res) => {
  try {
    const hotels = await Hotel.find(buildHotelDiscoveryQuery({}))
      .sort(buildHotelSort("featured"))
      .lean();
    const recommendations = buildHotelConciergeRecommendations(hotels, req.body);

    return res.status(200).json({ recommendations });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to build hotel concierge recommendations.",
      error: error.message,
    });
  }
});

router.get("/public/claim-search", async (req, res) => {
  try {
    const queryText = String(req.query.q || "").trim();
    const destination = String(req.query.destination || "").trim();
    const baseQuery = {
      published: true,
      marketplaceVisible: true,
    };

    if (!req.isPlatform) {
      baseQuery.tenantId = req.tenantId;
    }

    if (queryText) {
      baseQuery.$or = [
        { name: { $regex: queryText, $options: "i" } },
        { destination: { $regex: queryText, $options: "i" } },
        { region: { $regex: queryText, $options: "i" } },
      ];
    }

    if (destination) {
      baseQuery.destination = { $regex: destination, $options: "i" };
    }

    const hotels = await Hotel.find(baseQuery)
      .sort(buildHotelSort("featured"))
      .limit(12)
      .populate("tenantId", "name slug")
      .lean();

    return res.status(200).json({
      hotels: hotels.map((hotel) => ({
        id: String(hotel._id),
        name: hotel.name,
        slug: hotel.slug,
        destination: hotel.destination || "",
        region: hotel.region || "",
        accommodationType: hotel.accommodationType || "hotel",
        tenantId: hotel.tenantId?._id ? String(hotel.tenantId._id) : String(hotel.tenantId || ""),
        tenantName: hotel.tenantId?.name || "",
        tenantSlug: hotel.tenantId?.slug || "",
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to search hotels for claim requests.",
      error: error.message,
    });
  }
});

router.post("/public/claims", async (req, res) => {
  try {
    let selectedHotel = null;
    let tenantId = req.tenantId || null;
    const hotelId = req.body.hotelId ? String(req.body.hotelId) : "";

    if (hotelId) {
      selectedHotel = await Hotel.findById(hotelId).select("_id tenantId name destination").lean();

      if (!selectedHotel) {
        return res.status(404).json({ message: "Selected hotel could not be found." });
      }

      tenantId = selectedHotel.tenantId || tenantId;
    }

    const payload = await buildHotelClaimRequestPayload(
      {
        ...req.body,
        hotelNameSnapshot: req.body.hotelNameSnapshot || selectedHotel?.name || "",
        destinationSnapshot: req.body.destinationSnapshot || selectedHotel?.destination || "",
      },
      { tenantId }
    );

    const claim = await HotelClaimRequest.create(payload);

    return res.status(201).json({
      claim: shapeHotelClaimQueueItem(claim.toObject?.() || claim),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
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

router.get("/public/:slug/related", async (req, res) => {
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

    const query = [
      hotel.name,
      hotel.destination,
      hotel.region,
      hotel.accommodationType,
      hotel.summary,
      ...(Array.isArray(hotel.amenities) ? hotel.amenities : []),
    ]
      .filter(Boolean)
      .join(" ");

    const vectorResults = await searchAssistantKnowledge({
      tenantId: String(hotel.tenantId?._id || hotel.tenantId || ""),
      query,
      sourceTypes: ["hotel-listing"],
      limit: 6,
      env: process.env,
    });

    const vectorHotelIds = (vectorResults.hotelIds || []).filter(
      (hotelId) => String(hotelId) !== String(hotel._id)
    );

    let relatedHotels = [];
    if (vectorHotelIds.length) {
      const candidates = await Hotel.find({
        _id: { $in: vectorHotelIds },
        published: true,
        marketplaceVisible: true,
      })
        .populate("tenantId", "name slug")
        .lean();

      relatedHotels = vectorHotelIds
        .map((hotelId) =>
          candidates.find((candidate) => String(candidate._id) === String(hotelId))
        )
        .filter(Boolean);
    }

    if (!relatedHotels.length) {
      relatedHotels = await Hotel.find({
        _id: { $ne: hotel._id },
        published: true,
        marketplaceVisible: true,
        destination: hotel.destination || undefined,
      })
        .sort(buildHotelSort("rating"))
        .limit(3)
        .populate("tenantId", "name slug")
        .lean();
    }

    return res.status(200).json({
      hotels: relatedHotels.slice(0, 3).map(shapeHotelDiscoveryCard),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch related hotels.",
      error: error.message,
    });
  }
});

router.use(requireTenantAdmin);

router.get("/claims", async (req, res) => {
  try {
    const status = String(req.query.status || "").trim();
    const query = buildTenantFilter(req, {});

    if (status) {
      query.status = status;
    }

    const claims = await HotelClaimRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(claims.map(shapeHotelClaimQueueItem));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch hotel claims.", error: error.message });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const [hotels, inquiries, quotes] = await Promise.all([
      Hotel.find(buildTenantFilter(req)).lean(),
      CustomInquiry.find(
        buildTenantFilter(req, {
          hotelId: { $ne: null },
        })
      ).lean(),
      QuoteProposal.find(buildTenantFilter(req))
        .select("inquiryId status conversionStage")
        .lean(),
    ]);

    res.status(200).json(buildHotelAnalyticsSnapshot({ hotels, inquiries, quotes }));
  } catch (error) {
    res.status(500).json({ message: "Failed to build hotel analytics.", error: error.message });
  }
});

router.post("/claims/:id/review", async (req, res) => {
  try {
    const claim = await HotelClaimRequest.findOne(buildTenantFilter(req, { _id: req.params.id }));

    if (!claim) {
      return res.status(404).json({ message: "Hotel claim request not found." });
    }

    if (!["pending", "needs-more-proof"].includes(claim.status)) {
      return res.status(400).json({ message: "This hotel claim has already been resolved." });
    }

    const reviewUpdate = buildHotelClaimReviewUpdate(req.body, {
      reviewerId: req.admin?._id || null,
    });

    if (reviewUpdate.status !== "approved") {
      claim.status = reviewUpdate.status;
      claim.reviewedBy = reviewUpdate.reviewedBy;
      claim.reviewedAt = reviewUpdate.reviewedAt;
      claim.reviewNote = reviewUpdate.reviewNote;
      await claim.save();

      return res.status(200).json({
        claim: shapeHotelClaimQueueItem(claim.toObject()),
      });
    }

    let hotelId = claim.hotelId ? String(claim.hotelId) : "";
    if (!hotelId) {
      const createdHotel = await createPostgresFirstHotel(
        withTenantId(req, {
          ...claim.proposedHotelPayload,
          name: claim.proposedHotelPayload?.name || claim.hotelNameSnapshot,
          destination: claim.proposedHotelPayload?.destination || claim.destinationSnapshot,
        }),
        process.env
      );
      hotelId = String(createdHotel._id);
      claim.hotelId = createdHotel._id;
    }

    const partnerPayload = buildApprovedHotelPartnerAdminPayload({
      ...claim.toObject(),
      hotelId,
      tenantId: req.tenantId,
    });
    const partnerAdmin = await HotelPartnerAdmin.create(partnerPayload);

    claim.status = "approved";
    claim.reviewedBy = reviewUpdate.reviewedBy;
    claim.reviewedAt = reviewUpdate.reviewedAt;
    claim.reviewNote = reviewUpdate.reviewNote;
    claim.linkedPartnerAdminId = partnerAdmin._id;
    claim.tenantId = req.tenantId;
    await claim.save();

    return res.status(200).json({
      claim: shapeHotelClaimQueueItem(claim.toObject()),
      partnerAdmin: {
        id: String(partnerAdmin._id),
        username: partnerAdmin.username,
        displayName: partnerAdmin.displayName,
        role: partnerAdmin.role,
        hotelIds: partnerAdmin.hotelIds.map((item) => String(item)),
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

router.post("/:id/partner-profile-review", async (req, res) => {
  try {
    const hotel = await Hotel.findOne(buildTenantFilter(req, { _id: req.params.id })).lean();

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    if (hotel.pendingPartnerUpdate?.status !== "pending-review") {
      return res.status(400).json({ message: "No pending partner profile update to review." });
    }

    const action = req.body.action === "reject" ? "reject" : "approve";
    const reviewNote = String(req.body.reviewNote || "").trim();

    if (action === "reject") {
      const rejectedHotel = await Hotel.findOneAndUpdate(
        buildTenantFilter(req, { _id: req.params.id }),
        {
          "pendingPartnerUpdate.status": "rejected",
          "pendingPartnerUpdate.reviewedBy": req.admin?._id || null,
          "pendingPartnerUpdate.reviewedAt": new Date(),
          "pendingPartnerUpdate.reviewNote": reviewNote,
        },
        { new: true, runValidators: true }
      ).lean();

      return res.status(200).json(rejectedHotel);
    }

    const payload = normalizeHotelPayload(req, {
      ...hotel,
      ...(hotel.pendingPartnerUpdate.payload || {}),
    });
    delete payload.tenantId;
    payload.pendingPartnerUpdate = {
      ...hotel.pendingPartnerUpdate,
      status: "approved",
      reviewedBy: req.admin?._id || null,
      reviewedAt: new Date(),
      reviewNote,
    };

    const approvedHotel = await updatePostgresFirstHotel(req.params.id, req.tenantId, payload, process.env);
    return res.status(200).json(approvedHotel);
  } catch (error) {
    return res.status(400).json({ message: error.message });
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
    await deleteHotelListingVector(hotel._id, process.env).catch((error) => {
      console.error("Hotel vector delete failed:", error.message);
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
