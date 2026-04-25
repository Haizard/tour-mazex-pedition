import express from "express";
import AccommodationReservation from "../models/AccommodationReservation.js";
import Booking from "../models/Booking.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { summarizeAccommodationReservation } from "../utils/accommodationCoordination.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("accommodation-coordination"));

router.get("/", async (req, res) => {
  try {
    const reservations = await AccommodationReservation.find(buildTenantFilter(req))
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(
      reservations.map((reservation) => ({
        ...reservation,
        coordinationSummary: summarizeAccommodationReservation(reservation),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = withTenantId(req, {
      bookingId: req.body.bookingId || null,
      bookingGuestName: req.body.bookingGuestName,
      assignedTourTitle: req.body.assignedTourTitle,
      hotelName: req.body.hotelName,
      supplierName: req.body.supplierName,
      supplierContact: req.body.supplierContact,
      destination: req.body.destination,
      reservationCode: req.body.reservationCode,
      roomPlan: req.body.roomPlan,
      checkInDate: req.body.checkInDate || null,
      checkOutDate: req.body.checkOutDate || null,
      guestCount: req.body.guestCount,
      status: req.body.status,
      notes: req.body.notes,
    });

    if (payload.bookingId && (!payload.bookingGuestName || !payload.assignedTourTitle)) {
      const booking = await Booking.findOne(buildTenantFilter(req, { _id: payload.bookingId })).lean();
      payload.bookingGuestName = payload.bookingGuestName || booking?.name || "";
      payload.assignedTourTitle = payload.assignedTourTitle || booking?.packageTour || "";
      payload.guestCount = payload.guestCount || booking?.pax || 1;
    }

    const reservation = new AccommodationReservation(payload);
    await reservation.save();

    res.status(201).json({
      ...reservation.toObject(),
      coordinationSummary: summarizeAccommodationReservation(reservation.toObject()),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updates = {
      bookingId: Object.prototype.hasOwnProperty.call(req.body, "bookingId")
        ? req.body.bookingId || null
        : undefined,
      bookingGuestName: req.body.bookingGuestName,
      assignedTourTitle: req.body.assignedTourTitle,
      hotelName: req.body.hotelName,
      supplierName: req.body.supplierContact === undefined ? req.body.supplierName : req.body.supplierName,
      supplierContact: req.body.supplierContact,
      destination: req.body.destination,
      reservationCode: req.body.reservationCode,
      roomPlan: req.body.roomPlan,
      checkInDate: Object.prototype.hasOwnProperty.call(req.body, "checkInDate")
        ? req.body.checkInDate || null
        : undefined,
      checkOutDate: Object.prototype.hasOwnProperty.call(req.body, "checkOutDate")
        ? req.body.checkOutDate || null
        : undefined,
      guestCount: req.body.guestCount,
      status: req.body.status,
      notes: req.body.notes,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    if (updates.bookingId && (!updates.bookingGuestName || !updates.assignedTourTitle)) {
      const booking = await Booking.findOne(buildTenantFilter(req, { _id: updates.bookingId })).lean();
      updates.bookingGuestName = updates.bookingGuestName || booking?.name || "";
      updates.assignedTourTitle = updates.assignedTourTitle || booking?.packageTour || "";
      updates.guestCount = updates.guestCount || booking?.pax || 1;
    }

    if (updates.bookingId === null) {
      updates.bookingGuestName = "";
      updates.assignedTourTitle = "";
    }

    const reservation = await AccommodationReservation.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true }
    ).lean();

    if (!reservation) {
      return res.status(404).json({ message: "Accommodation reservation not found" });
    }

    res.status(200).json({
      ...reservation,
      coordinationSummary: summarizeAccommodationReservation(reservation),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const reservation = await AccommodationReservation.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!reservation) {
      return res.status(404).json({ message: "Accommodation reservation not found" });
    }

    res.status(200).json({ message: "Accommodation reservation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
