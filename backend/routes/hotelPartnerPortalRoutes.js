import express from "express";
import AccommodationReservation from "../models/AccommodationReservation.js";
import Hotel from "../models/Hotel.js";
import { requireHotelPartnerAdmin } from "../middleware/hotelPartnerAuthMiddleware.js";
import {
  buildHotelPartnerAccommodationResponseUpdate,
  buildHotelPartnerPendingProfileUpdate,
  canHotelPartnerManageAccommodationRequest,
  canHotelPartnerManageHotel,
} from "../utils/hotelPartnerAccess.js";
import { updatePostgresFirstAccommodationReservation } from "../utils/postgresFirstAccommodationService.js";

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

    const pendingPartnerUpdate = buildHotelPartnerPendingProfileUpdate(req.body, {
      partnerAdminId: req.hotelPartnerAdmin._id,
    });
    const updatedHotel = await Hotel.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { pendingPartnerUpdate },
      { new: true, runValidators: true }
    ).lean();

    return res.status(200).json(updatedHotel);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/accommodation-requests", async (req, res) => {
  try {
    const hotelIds = (req.hotelPartnerAdmin.hotelIds || []).map((hotelId) => String(hotelId));
    const requests = await AccommodationReservation.find({
      tenantId: req.tenantId,
      hotelId: { $in: hotelIds },
    })
      .sort({ checkInDate: 1, updatedAt: -1 })
      .lean();

    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/accommodation-requests/:id", async (req, res) => {
  try {
    const reservation = await AccommodationReservation.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).lean();

    if (!reservation) {
      return res.status(404).json({ message: "Accommodation request not found." });
    }

    if (!canHotelPartnerManageAccommodationRequest(req.hotelPartnerAdmin, reservation)) {
      return res.status(403).json({ message: "This accommodation request is not assigned to your hotels." });
    }

    const updates = buildHotelPartnerAccommodationResponseUpdate(req.body);
    const updatedReservation = await updatePostgresFirstAccommodationReservation(
      req.params.id,
      req.tenantId,
      updates
    );

    return res.status(200).json(updatedReservation);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
