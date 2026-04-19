import PlatformAdmin from "../models/PlatformAdmin.js";
import { verifyPlatformAdminToken } from "../utils/adminAuth.js";

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return req.headers["x-platform-admin-token"] || "";
};

export const requirePlatformAdmin = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Platform admin authentication required." });
    }

    const payload = verifyPlatformAdminToken(token);
    const admin = await PlatformAdmin.findOne({
      _id: payload.adminId,
      status: "active",
    });

    if (!admin) {
      return res.status(401).json({ message: "Platform admin session is no longer valid." });
    }

    req.platformAdmin = admin;
    req.platformAdminRole = admin.role;
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired platform admin session." });
  }
};
