import express from "express";
import AirportPickup from "../models/AirportPickup.js";
import Booking from "../models/Booking.js";
import GuideDriver from "../models/GuideDriver.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { summarizeAirportPickup } from "../utils/airportPickupCoordination.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("airport-pickup-coordination"));

router.get("/", async (req, res) => {
  try {
    const pickups = await AirportPickup.find(buildTenantFilter(req))
      .sort({ pickupDateTime: 1, createdAt: -1 })
      .lean();

    res.status(200).json(
      pickups.map((pickup) => ({
        ...pickup,
        coordinationSummary: summarizeAirportPickup(pickup),
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
      driverId: req.body.driverId || null,
      guestName: req.body.guestName,
      airportCode: req.body.airportCode,
      flightNumber: req.body.flightNumber,
      pickupDateTime: req.body.pickupDateTime || null,
      destinationLabel: req.body.destinationLabel,
      assignedTourTitle: req.body.assignedTourTitle,
      driverName: req.body.driverName,
      vehicleLabel: req.body.vehicleLabel,
      guestCount: req.body.guestCount,
      status: req.body.status,
      notes: req.body.notes,
    });

    if (payload.bookingId && (!payload.guestName || !payload.assignedTourTitle || !payload.guestCount)) {
      const booking = await Booking.findOne(buildTenantFilter(req, { _id: payload.bookingId })).lean();
      payload.guestName = payload.guestName || booking?.name || "";
      payload.assignedTourTitle = payload.assignedTourTitle || booking?.packageTour || "";
      payload.guestCount = payload.guestCount || booking?.pax || 1;
    }

    if (payload.driverId && !payload.driverName) {
      const driver = await GuideDriver.findOne(buildTenantFilter(req, { _id: payload.driverId })).lean();
      payload.driverName = driver?.fullName || "";
    }

    const pickup = new AirportPickup(payload);
    await pickup.save();

    res.status(201).json({
      ...pickup.toObject(),
      coordinationSummary: summarizeAirportPickup(pickup.toObject()),
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
      driverId: Object.prototype.hasOwnProperty.call(req.body, "driverId")
        ? req.body.driverId || null
        : undefined,
      guestName: req.body.guestName,
      airportCode: req.body.airportCode,
      flightNumber: req.body.flightNumber,
      pickupDateTime: Object.prototype.hasOwnProperty.call(req.body, "pickupDateTime")
        ? req.body.pickupDateTime || null
        : undefined,
      destinationLabel: req.body.destinationLabel,
      assignedTourTitle: req.body.assignedTourTitle,
      driverName: req.body.driverName,
      vehicleLabel: req.body.vehicleLabel,
      guestCount: req.body.guestCount,
      status: req.body.status,
      notes: req.body.notes,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    if (updates.bookingId && (!updates.guestName || !updates.assignedTourTitle || !updates.guestCount)) {
      const booking = await Booking.findOne(buildTenantFilter(req, { _id: updates.bookingId })).lean();
      updates.guestName = updates.guestName || booking?.name || "";
      updates.assignedTourTitle = updates.assignedTourTitle || booking?.packageTour || "";
      updates.guestCount = updates.guestCount || booking?.pax || 1;
    }

    if (updates.driverId && !updates.driverName) {
      const driver = await GuideDriver.findOne(buildTenantFilter(req, { _id: updates.driverId })).lean();
      updates.driverName = driver?.fullName || "";
    }

    if (updates.bookingId === null) {
      updates.guestName = "";
      updates.assignedTourTitle = "";
    }

    if (updates.driverId === null) {
      updates.driverName = "";
    }

    const pickup = await AirportPickup.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true }
    ).lean();

    if (!pickup) {
      return res.status(404).json({ message: "Airport pickup not found" });
    }

    res.status(200).json({
      ...pickup,
      coordinationSummary: summarizeAirportPickup(pickup),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const pickup = await AirportPickup.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!pickup) {
      return res.status(404).json({ message: "Airport pickup not found" });
    }

    res.status(200).json({ message: "Airport pickup deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
