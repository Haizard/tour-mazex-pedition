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

    if (payload.tenantId !== String(req.tenantId)) {
      return res
        .status(403)
        .json({ message: "Restaurant partner token does not match this tenant." });
    }

    const partnerAdmin = await RestaurantPartnerAdmin.findOne({
      _id: payload.partnerAdminId,
      tenantId: req.tenantId,
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
