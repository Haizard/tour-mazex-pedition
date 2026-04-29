import express from "express";
import AirportPickup from "../models/AirportPickup.js";
import Booking from "../models/Booking.js";
import GuideDriver from "../models/GuideDriver.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import {
  buildAirportArrivalTimeline,
  buildAirportPickupDashboard,
  enrichAirportPickups,
  hasAirportPickupTimingConflict,
} from "../utils/airportPickupCoordination.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
  deleteMongoDocumentFromShadowStore,
  syncMongoDocumentToShadowStore,
} from "../utils/postgresShadowWrites.js";
import {
  deleteAirportPickupRecord,
  syncAirportPickupRecord,
} from "../utils/postgresOperationsRecords.js";
import { fetchPrimaryAirportPickupData } from "../utils/postgresPrimaryReads.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("airport-pickup-coordination"));

const syncAirportPickupViews = async (pickup = {}) => {
  await syncMongoDocumentToShadowStore({
    entityType: "airport-pickups",
    document: pickup,
    model: AirportPickup,
  });

  try {
    await syncAirportPickupRecord(pickup);
  } catch (error) {
    console.error("Airport pickup record sync failed:", error.message);
  }
};

const enrichPickupContext = async (req, payload = {}) => {
  const nextPayload = { ...payload };

  if (nextPayload.bookingId && (!nextPayload.guestName || !nextPayload.assignedTourTitle || !nextPayload.guestCount)) {
    const booking = await Booking.findOne(buildTenantFilter(req, { _id: nextPayload.bookingId })).lean();

    if (!booking) {
      throw new Error("Linked booking was not found.");
    }

    nextPayload.guestName = booking.name || "";
    nextPayload.assignedTourTitle = booking.packageTour || "";
    nextPayload.guestCount = nextPayload.guestCount || booking.pax || 1;
    nextPayload.pickupDateTime = nextPayload.pickupDateTime || booking.travelDate || null;
  }

  if (nextPayload.driverId && !nextPayload.driverName) {
    const driver = await GuideDriver.findOne(buildTenantFilter(req, { _id: nextPayload.driverId })).lean();

    if (!driver) {
      throw new Error("Assigned driver was not found.");
    }

    nextPayload.driverName = driver.fullName || "";
  }

  return nextPayload;
};

const validatePickupPayload = async (req, payload = {}, currentPickupId = null) => {
  if (payload.driverId) {
    const driver = await GuideDriver.findOne(buildTenantFilter(req, { _id: payload.driverId })).lean();

    if (!driver) {
      throw new Error("Assigned driver was not found.");
    }

    if (driver.staffType !== "driver") {
      throw new Error("Only driver team members can be assigned to airport pickups.");
    }

    if (driver.availabilityStatus === "off-duty") {
      throw new Error(`${driver.fullName || "This driver"} is marked off duty and cannot be assigned.`);
    }

    const existingPickups = await AirportPickup.find(
      buildTenantFilter(req, {
        _id: { $ne: currentPickupId || null },
        driverId: payload.driverId,
        status: { $ne: "cancelled" },
      })
    ).lean();

    const conflictingPickup = existingPickups.find((pickup) => hasAirportPickupTimingConflict(payload, pickup));

    if (conflictingPickup) {
      throw new Error(
        `${driver.fullName || "This driver"} already has another transfer scheduled too close to this pickup window.`
      );
    }
  }
};

router.get("/", async (req, res) => {
  try {
    if (req.query.source === "postgres") {
      const payload = await fetchPrimaryAirportPickupData(req.tenantId);
      return res.status(200).json(payload.pickups);
    }

    const [pickups, drivers] = await Promise.all([
      AirportPickup.find(buildTenantFilter(req))
        .sort({ pickupDateTime: 1, createdAt: -1 })
        .lean(),
      GuideDriver.find(buildTenantFilter(req, { staffType: "driver" })).lean(),
    ]);

    res.status(200).json(enrichAirportPickups(pickups, drivers));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    if (req.query.source === "postgres") {
      return res.status(200).json(await fetchPrimaryAirportPickupData(req.tenantId));
    }

    const [pickups, drivers, bookings] = await Promise.all([
      AirportPickup.find(buildTenantFilter(req))
        .sort({ pickupDateTime: 1, createdAt: -1 })
        .lean(),
      GuideDriver.find(buildTenantFilter(req, { staffType: "driver" })).lean(),
      Booking.find(buildTenantFilter(req))
        .sort({ travelDate: 1, createdAt: -1 })
        .lean(),
    ]);
    const enrichedPickups = enrichAirportPickups(pickups, drivers);

    res.status(200).json({
      pickups: enrichedPickups,
      board: buildAirportPickupDashboard(bookings, enrichedPickups),
      arrivalTimeline: buildAirportArrivalTimeline(enrichedPickups),
      needsAttention: enrichedPickups.filter(
        (pickup) =>
          pickup.status !== "cancelled" &&
          ((pickup.conflictCount || 0) > 0 ||
            (pickup.status === "scheduled" && !pickup.lastDriverBriefSharedAt))
      ),
      stats: {
        total: enrichedPickups.length,
        scheduled: enrichedPickups.filter((pickup) => pickup.status === "scheduled").length,
        pending: enrichedPickups.filter((pickup) => pickup.status === "pending").length,
        conflicts: enrichedPickups.filter((pickup) => pickup.conflictCount > 0).length,
      },
    });
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
      lastDriverBriefSharedAt: Object.prototype.hasOwnProperty.call(req.body, "lastDriverBriefSharedAt")
        ? req.body.lastDriverBriefSharedAt || null
        : undefined,
      notes: req.body.notes,
    });

    const normalizedPayload = await enrichPickupContext(req, payload);
    await validatePickupPayload(req, normalizedPayload);

    const pickup = new AirportPickup(normalizedPayload);
    await pickup.save();
    await syncAirportPickupViews(pickup.toObject());

    const [driver] = normalizedPayload.driverId
      ? await Promise.all([GuideDriver.findOne(buildTenantFilter(req, { _id: normalizedPayload.driverId })).lean()])
      : [null];

    res.status(201).json(enrichAirportPickups([pickup.toObject()], driver ? [driver] : [])[0]);
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
      lastDriverBriefSharedAt: Object.prototype.hasOwnProperty.call(req.body, "lastDriverBriefSharedAt")
        ? req.body.lastDriverBriefSharedAt || null
        : undefined,
      notes: req.body.notes,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    if (updates.bookingId === null) {
      updates.guestName = "";
      updates.assignedTourTitle = "";
    }

    if (updates.driverId === null) {
      updates.driverName = "";
    }

    const currentPickup = await AirportPickup.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!currentPickup) {
      return res.status(404).json({ message: "Airport pickup not found" });
    }

    const mergedPayload = await enrichPickupContext(req, {
      ...currentPickup,
      ...updates,
    });
    await validatePickupPayload(req, mergedPayload, req.params.id);

    const pickup = await AirportPickup.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      {
        $set: {
          ...updates,
          guestName: mergedPayload.guestName,
          assignedTourTitle: mergedPayload.assignedTourTitle,
          guestCount: mergedPayload.guestCount,
          pickupDateTime: mergedPayload.pickupDateTime,
          driverName: mergedPayload.driverName,
        },
      },
      { new: true }
    ).lean();
    await syncAirportPickupViews(pickup);

    const driver = pickup.driverId
      ? await GuideDriver.findOne(buildTenantFilter(req, { _id: pickup.driverId })).lean()
      : null;

    res.status(200).json(enrichAirportPickups([pickup], driver ? [driver] : [])[0]);
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

    await deleteAirportPickupRecord(pickup._id, pickup.tenantId);
    await deleteMongoDocumentFromShadowStore({
      entityType: "airport-pickups",
      sourceId: pickup._id,
    });

    res.status(200).json({ message: "Airport pickup deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
