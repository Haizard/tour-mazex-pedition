import express from "express";
import Hotel from "../models/Hotel.js";
import { requireHotelPartnerAdmin } from "../middleware/hotelPartnerAuthMiddleware.js";
import {
  buildHotelPartnerProfileUpdate,
  canHotelPartnerManageHotel,
} from "../utils/hotelPartnerAccess.js";
import { updatePostgresFirstHotel } from "../utils/postgresFirstHotelService.js";

const router = express.Router();

router.use(requireHotelPartnerAdmin);

router.get("/hotels", async (req, res) => {
  try {
    const hotelIds = (req.hotelPartnerAdmin.hotelIds || []).map((hotelId) => String(hotelId));
    const hotels = await Hotel.find({
      tenantId: req.tenantId,
      _id: { $in: hotelIds },
    })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ hotels });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/hotels/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, tenantId: req.tenantId }).lean();

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    if (!canHotelPartnerManageHotel(req.hotelPartnerAdmin, hotel)) {
      return res.status(403).json({ message: "This hotel is not assigned to your partner account." });
    }

    const payload = buildHotelPartnerProfileUpdate(req.body);
    const updatedHotel = await updatePostgresFirstHotel(req.params.id, req.tenantId, payload);

    return res.status(200).json(updatedHotel);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
