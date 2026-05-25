import express from "express";
import Restaurant from "../models/Restaurant.js";
import RestaurantClaimRequest from "../models/RestaurantClaimRequest.js";
import RestaurantPartnerAdmin from "../models/RestaurantPartnerAdmin.js";
import CustomInquiry from "../models/CustomInquiry.js";
import QuoteProposal from "../models/QuoteProposal.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
  buildApprovedRestaurantPartnerAdminPayload,
  buildRestaurantClaimRequestPayload,
  buildRestaurantClaimReviewUpdate,
  shapeRestaurantClaimQueueItem,
} from "../utils/restaurantClaimFlow.js";
import {
  buildRestaurantConciergeRecommendations,
  buildRestaurantDiscoveryQuery,
  buildRestaurantSort,
  shapeRestaurantDetail,
  shapeRestaurantDiscoveryCard,
} from "../utils/restaurantMarketplace.js";
import {
  createPostgresFirstRestaurant,
  updatePostgresFirstRestaurant,
} from "../utils/postgresFirstRestaurantService.js";
import { buildRestaurantAnalyticsSnapshot } from "../utils/restaurantAnalytics.js";
import {
  deleteRestaurantRecord,
  findRestaurantRecord,
} from "../utils/postgresRestaurantRecords.js";
import { deleteMongoDocumentFromShadowStore } from "../utils/postgresShadowWrites.js";

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

const asStringArray = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

const normalizeRestaurantPayload = (req, body = {}) => {
  const name = String(body.name || "").trim();
  if (!name) {
    throw new Error("Restaurant name is required.");
  }

  const slug = slugify(body.slug || name);
  if (!slug) {
    throw new Error("Restaurant slug is required.");
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
    cuisineTypes: asStringArray(body.cuisineTypes),
    mealTypes: asStringArray(body.mealTypes),
    dietaryFits: asStringArray(body.dietaryFits),
    ambianceTags: asStringArray(body.ambianceTags),
    openingHoursSummary: body.openingHoursSummary || "",
    reservationStyleSummary: body.reservationStyleSummary || "",
    photos: asStringArray(body.photos),
    averageRating:
      body.averageRating === null || body.averageRating === ""
        ? null
        : Number(body.averageRating || 0),
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
    const query = buildRestaurantDiscoveryQuery(req.query);
    const restaurants = await Restaurant.find(query)
      .sort(buildRestaurantSort(req.query.sort))
      .populate("tenantId", "name slug")
      .lean();

    return res.status(200).json({
      restaurants: restaurants.map(shapeRestaurantDiscoveryCard),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch restaurants.", error: error.message });
  }
});

router.post("/public/concierge/recommendations", async (req, res) => {
  try {
    const restaurants = await Restaurant.find(buildRestaurantDiscoveryQuery({}))
      .sort(buildRestaurantSort("featured"))
      .lean();
    const recommendations = buildRestaurantConciergeRecommendations(restaurants, req.body);
    return res.status(200).json({ recommendations });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to build restaurant concierge recommendations.",
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

    const restaurants = await Restaurant.find(baseQuery)
      .sort(buildRestaurantSort("featured"))
      .limit(12)
      .populate("tenantId", "name slug")
      .lean();

    return res.status(200).json({
      restaurants: restaurants.map((restaurant) => ({
        id: String(restaurant._id),
        name: restaurant.name,
        slug: restaurant.slug,
        destination: restaurant.destination || "",
        region: restaurant.region || "",
        cuisineTypes: Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes : [],
        tenantId: restaurant.tenantId?._id
          ? String(restaurant.tenantId._id)
          : String(restaurant.tenantId || ""),
        tenantName: restaurant.tenantId?.name || "",
        tenantSlug: restaurant.tenantId?.slug || "",
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to search restaurants for claim requests.",
      error: error.message,
    });
  }
});

router.post("/public/claims", async (req, res) => {
  try {
    let selectedRestaurant = null;
    let tenantId = req.tenantId || null;
    const restaurantId = req.body.restaurantId ? String(req.body.restaurantId) : "";

    if (restaurantId) {
      selectedRestaurant = await Restaurant.findById(restaurantId)
        .select("_id tenantId name destination region")
        .lean();

      if (!selectedRestaurant) {
        return res.status(404).json({ message: "Selected restaurant could not be found." });
      }

      tenantId = selectedRestaurant.tenantId || tenantId;
    }

    const payload = await buildRestaurantClaimRequestPayload(
      {
        ...req.body,
        restaurantNameSnapshot: req.body.restaurantNameSnapshot || selectedRestaurant?.name || "",
        destinationSnapshot: req.body.destinationSnapshot || selectedRestaurant?.destination || "",
        regionSnapshot: req.body.regionSnapshot || selectedRestaurant?.region || "",
      },
      { tenantId }
    );

    const claim = await RestaurantClaimRequest.create(payload);

    return res.status(201).json({
      claim: shapeRestaurantClaimQueueItem(claim.toObject?.() || claim),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/public/:slug", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.slug,
      published: true,
      marketplaceVisible: true,
    })
      .populate("tenantId", "name slug")
      .lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found in marketplace." });
    }

    return res.status(200).json(shapeRestaurantDetail(restaurant));
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch restaurant.", error: error.message });
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

    const claims = await RestaurantClaimRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(claims.map(shapeRestaurantClaimQueueItem));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch restaurant claims.",
      error: error.message,
    });
  }
});

router.post("/claims/:id/review", async (req, res) => {
  try {
    const claim = await RestaurantClaimRequest.findOne(buildTenantFilter(req, { _id: req.params.id }));

    if (!claim) {
      return res.status(404).json({ message: "Restaurant claim request not found." });
    }

    if (!["pending", "needs-more-proof"].includes(claim.status)) {
      return res.status(400).json({ message: "This restaurant claim has already been resolved." });
    }

    const reviewUpdate = buildRestaurantClaimReviewUpdate(req.body, {
      reviewerId: req.admin?._id || null,
    });

    if (reviewUpdate.status !== "approved") {
      claim.status = reviewUpdate.status;
      claim.reviewedBy = reviewUpdate.reviewedBy;
      claim.reviewedAt = reviewUpdate.reviewedAt;
      claim.reviewNote = reviewUpdate.reviewNote;
      await claim.save();

      return res.status(200).json({
        claim: shapeRestaurantClaimQueueItem(claim.toObject()),
      });
    }

    let restaurantId = claim.restaurantId ? String(claim.restaurantId) : "";
    if (!restaurantId) {
      const createdRestaurant = await createPostgresFirstRestaurant(
        withTenantId(req, {
          ...claim.proposedRestaurantPayload,
          name:
            claim.proposedRestaurantPayload?.name || claim.restaurantNameSnapshot,
          destination:
            claim.proposedRestaurantPayload?.destination || claim.destinationSnapshot,
          region: claim.proposedRestaurantPayload?.region || claim.regionSnapshot,
        }),
        process.env
      );
      restaurantId = String(createdRestaurant._id);
      claim.restaurantId = createdRestaurant._id;
    }

    const partnerPayload = buildApprovedRestaurantPartnerAdminPayload({
      ...claim.toObject(),
      restaurantId,
      tenantId: req.tenantId,
    });
    const partnerAdmin = await RestaurantPartnerAdmin.create(partnerPayload);

    claim.status = "approved";
    claim.reviewedBy = reviewUpdate.reviewedBy;
    claim.reviewedAt = reviewUpdate.reviewedAt;
    claim.reviewNote = reviewUpdate.reviewNote;
    claim.linkedPartnerAdminId = partnerAdmin._id;
    claim.tenantId = req.tenantId;
    await claim.save();

    return res.status(200).json({
      claim: shapeRestaurantClaimQueueItem(claim.toObject()),
      partnerAdmin: {
        id: String(partnerAdmin._id),
        username: partnerAdmin.username,
        displayName: partnerAdmin.displayName,
        role: partnerAdmin.role,
        restaurantIds: partnerAdmin.restaurantIds.map((item) => String(item)),
      },
    });
  } catch (error) {
    const duplicateMessage =
      error.code === 11000
        ? "A restaurant partner admin with that username already exists for this tenant."
        : error.message;
    return res.status(400).json({ message: duplicateMessage });
  }
});

router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find(buildTenantFilter(req))
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json(restaurants);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch restaurants.", error: error.message });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const [restaurants, inquiries, quotes] = await Promise.all([
      Restaurant.find(buildTenantFilter(req)).sort({ sponsoredPlacement: -1, name: 1 }).lean(),
      CustomInquiry.find(
        buildTenantFilter(req, {
          restaurantId: { $ne: null },
        })
      )
        .select("_id restaurantId restaurantIntentType createdAt")
        .lean(),
      QuoteProposal.find(buildTenantFilter(req))
        .select("inquiryId status conversionStage")
        .lean(),
    ]);

    return res
      .status(200)
      .json(buildRestaurantAnalyticsSnapshot({ restaurants, inquiries, quotes }));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to build restaurant analytics.",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = normalizeRestaurantPayload(req, req.body);
    const restaurant = await createPostgresFirstRestaurant(payload, process.env);
    const refreshed = await findRestaurantRecord(restaurant._id, req.tenantId, process.env).catch(
      () => null
    );

    return res.status(201).json(refreshed ? shapeRestaurantDetail(refreshed) : restaurant);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const payload = normalizeRestaurantPayload(req, req.body);
    const restaurant = await updatePostgresFirstRestaurant(
      req.params.id,
      req.tenantId,
      payload,
      process.env
    );

    return res.status(200).json(restaurant);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    await deleteRestaurantRecord(restaurant._id, req.tenantId, process.env).catch(() => {});
    await deleteMongoDocumentFromShadowStore({
      entityType: "restaurants",
      sourceId: restaurant._id,
      tenantId: req.tenantId,
      model: Restaurant,
      env: process.env,
    }).catch(() => {});

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
