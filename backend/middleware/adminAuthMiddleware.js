import TenantAdmin from "../models/TenantAdmin.js";
import { verifyAdminToken } from "../utils/adminAuth.js";

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return req.headers["x-admin-token"] || "";
};

export const requireTenantAdmin = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Admin authentication required." });
    }

    const payload = verifyAdminToken(token);

    if (payload.tenantId !== String(req.tenantId)) {
      return res.status(403).json({ message: "Admin token does not match this tenant." });
    }

    const admin = await TenantAdmin.findOne({
      _id: payload.adminId,
      tenantId: req.tenantId,
      status: "active",
    });

    if (!admin) {
      return res.status(401).json({ message: "Admin session is no longer valid." });
    }

    req.admin = admin;
    req.adminRole = admin.role;
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired admin session." });
  }
};
