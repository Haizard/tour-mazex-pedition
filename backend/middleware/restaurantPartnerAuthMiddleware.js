import RestaurantPartnerAdmin from "../models/RestaurantPartnerAdmin.js";
import { verifyRestaurantPartnerToken } from "../utils/adminAuth.js";

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return req.headers["x-restaurant-partner-token"] || "";
};

export const requireRestaurantPartnerAdmin = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Restaurant partner authentication required." });
    }

    const payload = verifyRestaurantPartnerToken(token);

    // When on the platform domain (req.tenantId is null), use the token's
    // stored tenantId so the partner's data is scoped correctly.
    const resolvedTenantId = req.tenantId || payload.tenantId;

    if (payload.tenantId !== String(resolvedTenantId)) {
      return res
        .status(403)
        .json({ message: "Restaurant partner token does not match this tenant." });
    }

    if (!req.tenantId) {
      req.tenantId = resolvedTenantId;
    }

    const partnerAdmin = await RestaurantPartnerAdmin.findOne({
      _id: payload.partnerAdminId,
      tenantId: resolvedTenantId,
      status: "active",
    });

    if (!partnerAdmin) {
      return res.status(401).json({ message: "Restaurant partner session is no longer valid." });
    }

    req.restaurantPartnerAdmin = partnerAdmin;
    req.restaurantPartnerRole = partnerAdmin.role;
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired restaurant partner session." });
  }
};
