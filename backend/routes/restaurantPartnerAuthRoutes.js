import express from "express";
import RestaurantPartnerAdmin from "../models/RestaurantPartnerAdmin.js";
import { requireRestaurantPartnerAdmin } from "../middleware/restaurantPartnerAuthMiddleware.js";
import { signRestaurantPartnerToken, verifyAdminPassword } from "../utils/adminAuth.js";

const router = express.Router();

const shapePartnerAdmin = (admin = {}) => ({
  id: admin._id,
  username: admin.username,
  displayName: admin.displayName,
  role: admin.role,
  restaurantIds: (admin.restaurantIds || []).map((restaurantId) => String(restaurantId)),
  lastLoginAt: admin.lastLoginAt,
});

router.post("/login", async (req, res) => {
  try {
    const username = req.body.username?.toString().trim().toLowerCase();
    const password = req.body.password?.toString() || "";

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const partnerAdmin = await RestaurantPartnerAdmin.findOne({
      tenantId: req.tenantId,
      username,
      status: "active",
    });

    if (!partnerAdmin) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValid = await verifyAdminPassword(
      password,
      partnerAdmin.passwordSalt,
      partnerAdmin.passwordHash
    );

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    partnerAdmin.lastLoginAt = new Date();
    await partnerAdmin.save();

    const token = signRestaurantPartnerToken({
      partnerAdminId: String(partnerAdmin._id),
      tenantId: String(req.tenantId),
      username: partnerAdmin.username,
      role: partnerAdmin.role,
      restaurantIds: partnerAdmin.restaurantIds,
    });

    return res.status(200).json({
      token,
      partnerAdmin: shapePartnerAdmin(partnerAdmin),
      tenant: {
        id: req.tenant._id,
        name: req.tenant.name,
        slug: req.tenant.slug,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/me", requireRestaurantPartnerAdmin, async (req, res) => {
  res.status(200).json({
    partnerAdmin: shapePartnerAdmin(req.restaurantPartnerAdmin),
    tenant: {
      id: req.tenant._id,
      name: req.tenant.name,
      slug: req.tenant.slug,
    },
  });
});

export default router;
