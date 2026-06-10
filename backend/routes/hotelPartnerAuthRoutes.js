import express from "express";
import Tenant from "../models/Tenant.js";
import HotelPartnerAdmin from "../models/HotelPartnerAdmin.js";
import { requireHotelPartnerAdmin } from "../middleware/hotelPartnerAuthMiddleware.js";
import { signHotelPartnerToken, verifyAdminPassword } from "../utils/adminAuth.js";

const router = express.Router();

const shapePartnerAdmin = (admin = {}) => ({
  id: admin._id,
  username: admin.username,
  displayName: admin.displayName,
  role: admin.role,
  hotelIds: (admin.hotelIds || []).map((hotelId) => String(hotelId)),
  lastLoginAt: admin.lastLoginAt,
});

router.post("/login", async (req, res) => {
  try {
    const username = req.body.username?.toString().trim().toLowerCase();
    const password = req.body.password?.toString() || "";

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    // On the platform domain (e.g. mazexpeditions.vercel.app), req.tenantId is null.
    // Look up the partner admin by username across all tenants and use the
    // stored tenantId from the admin record to sign the token.
    // When req.tenantId is available (tenant subdomain), scope the lookup.
    const partnerAdmin = await HotelPartnerAdmin.findOne({
      ...(req.tenantId ? { tenantId: req.tenantId } : {}),
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

    const actualTenantId = String(partnerAdmin.tenantId || "");

    const token = signHotelPartnerToken({
      partnerAdminId: String(partnerAdmin._id),
      tenantId: actualTenantId,
      username: partnerAdmin.username,
      role: partnerAdmin.role,
      hotelIds: partnerAdmin.hotelIds,
    });

    // Look up the tenant for the response (required on platform domain)
    const resolvedTenant = req.tenant || (actualTenantId
      ? await Tenant.findById(actualTenantId).lean().catch(() => null)
      : null);

    return res.status(200).json({
      token,
      partnerAdmin: shapePartnerAdmin(partnerAdmin),
      tenant: resolvedTenant
        ? {
            id: resolvedTenant._id,
            name: resolvedTenant.name,
            slug: resolvedTenant.slug,
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/me", requireHotelPartnerAdmin, async (req, res) => {
  // On the platform domain req.tenant may be null; resolve from token tenantId
  const resolvedTenant = req.tenant || (req.tenantId
    ? await Tenant.findById(req.tenantId).lean().catch(() => null)
    : null);

  res.status(200).json({
    partnerAdmin: shapePartnerAdmin(req.hotelPartnerAdmin),
    tenant: resolvedTenant
      ? {
          id: resolvedTenant._id,
          name: resolvedTenant.name,
          slug: resolvedTenant.slug,
        }
      : null,
  });
});

export default router;
