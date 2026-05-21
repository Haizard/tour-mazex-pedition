import HotelPartnerAdmin from "../models/HotelPartnerAdmin.js";
import { verifyHotelPartnerToken } from "../utils/adminAuth.js";

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return req.headers["x-hotel-partner-token"] || "";
};

export const requireHotelPartnerAdmin = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Hotel partner authentication required." });
    }

    const payload = verifyHotelPartnerToken(token);

    if (payload.tenantId !== String(req.tenantId)) {
      return res.status(403).json({ message: "Hotel partner token does not match this tenant." });
    }

    const partnerAdmin = await HotelPartnerAdmin.findOne({
      _id: payload.partnerAdminId,
      tenantId: req.tenantId,
      status: "active",
    });

    if (!partnerAdmin) {
      return res.status(401).json({ message: "Hotel partner session is no longer valid." });
    }

    req.hotelPartnerAdmin = partnerAdmin;
    req.hotelPartnerRole = partnerAdmin.role;
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired hotel partner session." });
  }
};
