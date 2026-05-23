import express from "express";
import PlatformAdmin from "../models/PlatformAdmin.js";
import { requirePlatformAdmin } from "../middleware/platformAdminAuthMiddleware.js";
import {
  signPlatformAdminToken,
  verifyAdminPassword,
} from "../utils/adminAuth.js";
import {
  ensureDefaultPlatformAdmin,
  shouldRecoverPlatformAdminWithEnv,
  syncConfiguredPlatformAdminPassword,
} from "../utils/platformAdminBootstrap.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const username = req.body.username?.toString().trim().toLowerCase();
    const password = req.body.password?.toString() || "";

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    let admin = await PlatformAdmin.findOne({ username, status: "active" });

    if (!admin && shouldRecoverPlatformAdminWithEnv({ username, password, env: process.env })) {
      await ensureDefaultPlatformAdmin(process.env);
      admin = await PlatformAdmin.findOne({ username, status: "active" });
    }

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    let isValid = await verifyAdminPassword(
      password,
      admin.passwordSalt,
      admin.passwordHash
    );

    if (!isValid && shouldRecoverPlatformAdminWithEnv({ username, password, env: process.env })) {
      admin = await syncConfiguredPlatformAdminPassword(admin, process.env);
      isValid = await verifyAdminPassword(
        password,
        admin.passwordSalt,
        admin.passwordHash
      );
    }

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = signPlatformAdminToken({
      adminId: String(admin._id),
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
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", requirePlatformAdmin, async (req, res) => {
  res.status(200).json({
    admin: {
      id: req.platformAdmin._id,
      username: req.platformAdmin.username,
      displayName: req.platformAdmin.displayName,
      role: req.platformAdmin.role,
      lastLoginAt: req.platformAdmin.lastLoginAt,
    },
  });
});

export default router;
