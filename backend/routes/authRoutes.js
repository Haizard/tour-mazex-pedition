import express from "express";
import TenantAdmin from "../models/TenantAdmin.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { signAdminToken, verifyAdminPassword } from "../utils/adminAuth.js";
import { handleTravelerGoogleCallback } from "./travelerAuthRoutes.js";

const router = express.Router();

router.get("/callback/google", handleTravelerGoogleCallback);

router.post("/login", async (req, res) => {
  try {
    const username = req.body.username?.toString().trim().toLowerCase();
    const password = req.body.password?.toString() || "";

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    console.log(`[Login Attempt] TenantID: ${req.tenantId}, Username: ${username}`);

    const admin = await TenantAdmin.findOne({
      tenantId: req.tenantId,
      username,
      status: "active",
    });

    if (!admin) {
      console.warn(`[Login Failed] Admin not found for username "${username}" in tenant ${req.tenantId}`);
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValid = await verifyAdminPassword(
      password,
      admin.passwordSalt,
      admin.passwordHash
    );

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = signAdminToken({
      adminId: String(admin._id),
      tenantId: String(req.tenantId),
      username: admin.username,
      role: admin.role,
    });

    res.status(200).json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
      },
      tenant: {
        id: req.tenant._id,
        name: req.tenant.name,
        slug: req.tenant.slug,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", requireTenantAdmin, async (req, res) => {
  res.status(200).json({
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      displayName: req.admin.displayName,
      role: req.admin.role,
      lastLoginAt: req.admin.lastLoginAt,
    },
    tenant: {
      id: req.tenant._id,
      name: req.tenant.name,
      slug: req.tenant.slug,
    },
  });
});

export default router;
