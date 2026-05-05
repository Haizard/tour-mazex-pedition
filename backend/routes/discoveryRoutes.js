import express from "express";
import TourPackage from "../models/TourPackage.js";
import Tenant from "../models/Tenant.js";

const router = express.Router();

/**
 * GET /api/discovery/tours
 * Fetch global tours marked as marketplace visible.
 * Supports filtering, searching, and pagination.
 */
router.get("/tours", async (req, res) => {
  try {
    const {
      q, // Search query
      location,
      minPrice,
      maxPrice,
      category,
      limit = 20,
      page = 1,
    } = req.query;

    const query = { isMarketplaceVisible: true };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { destinationsVisited: { $regex: q, $options: "i" } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const tours = await TourPackage.find(query)
      .populate("tenantId", "name slug")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await TourPackage.countDocuments(query);

    res.status(200).json({
      tours,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch discovery tours", error: error.message });
  }
});

/**
 * GET /api/discovery/tours/:id
 * Fetch a specific marketplace-visible tour by ID.
 */
router.get("/tours/:id", async (req, res) => {
  try {
    const tour = await TourPackage.findOne({
      _id: req.params.id,
      isMarketplaceVisible: true
    }).populate("tenantId", "name slug").lean();

    if (!tour) {
      return res.status(404).json({ message: "Tour not found in marketplace." });
    }

    res.status(200).json(tour);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tour details", error: error.message });
  }
});

/**
 * GET /api/discovery/operators
 * Fetch a list of active operators on the network.
 */
router.get("/operators", async (req, res) => {
  try {
    const operators = await Tenant.find({ status: "active" })
      .select("name slug customDomains")
      .lean();

    res.status(200).json(operators);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch operators", error: error.message });
  }
});

export default router;
