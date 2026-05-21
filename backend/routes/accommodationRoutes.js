import express from "express";
import process from "node:process";
import AccommodationReservation from "../models/AccommodationReservation.js";
import Booking from "../models/Booking.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import {
  buildAccommodationDashboard,
  buildAccommodationStayTimeline,
  enrichAccommodationReservations,
} from "../utils/accommodationCoordination.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
  deleteMongoDocumentFromShadowStore,
  syncMongoDocumentToShadowStore,
} from "../utils/postgresShadowWrites.js";
import {
  buildAccommodationReservationView,
  deleteAccommodationReservationRecord,
  findAccommodationReservationRecord,
  syncAccommodationReservationRecord,
} from "../utils/postgresOperationsRecords.js";
import {
  createPostgresFirstAccommodationReservation,
  updatePostgresFirstAccommodationReservation,
} from "../utils/postgresFirstAccommodationService.js";
import { fetchPrimaryAccommodationData } from "../utils/postgresPrimaryReads.js";
import { preferPrimaryCollection, preferPrimaryDashboard } from "../utils/postgresReadFallback.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("accommodation-coordination"));

const syncAccommodationViews = async (reservation = {}) => {
  await syncMongoDocumentToShadowStore({
    entityType: "accommodation-reservations",
    document: reservation,
    model: AccommodationReservation,
  });

  try {
    await syncAccommodationReservationRecord(reservation);
  } catch (error) {
    console.error("Accommodation record sync failed:", error.message);
  }
};

const enrichBookingContext = async (req, payload = {}) => {
  const nextPayload = { ...payload };

  if (!nextPayload.bookingId) {
    return nextPayload;
  }

  const booking = await Booking.findOne(buildTenantFilter(req, { _id: nextPayload.bookingId })).lean();

  if (!booking) {
    throw new Error("Linked booking was not found.");
  }

  nextPayload.bookingGuestName = booking.name || "";
  nextPayload.assignedTourTitle = booking.packageTour || "";
  nextPayload.guestCount = nextPayload.guestCount || booking.pax || 1;
  nextPayload.destination = nextPayload.destination || booking.packageTour || "";
  nextPayload.checkInDate = nextPayload.checkInDate || booking.travelDate || null;

  return nextPayload;
};

const validateReservationPayload = async (req, payload = {}, currentReservationId = null) => {
  if (payload.checkInDate && payload.checkOutDate) {
    const checkIn = new Date(payload.checkInDate);
    const checkOut = new Date(payload.checkOutDate);

    if (checkIn > checkOut) {
      throw new Error("Check-out date cannot be earlier than check-in date.");
    }
  }

  if (payload.bookingId) {
    const duplicateBookingReservation = await AccommodationReservation.findOne(
      buildTenantFilter(req, {
        _id: { $ne: currentReservationId || null },
        bookingId: payload.bookingId,
        status: { $ne: "cancelled" },
      })
    ).lean();

    if (duplicateBookingReservation) {
      throw new Error(
        `This booking is already linked to ${duplicateBookingReservation.hotelName || "another active reservation"}.`
      );
    }
  }

  if (payload.reservationCode) {
    const duplicateReservationCode = await AccommodationReservation.findOne(
      buildTenantFilter(req, {
        _id: { $ne: currentReservationId || null },
        reservationCode: payload.reservationCode,
        status: { $ne: "cancelled" },
      })
    ).lean();

    if (duplicateReservationCode) {
      throw new Error("This reservation code is already in use for another active stay.");
    }
  }
};

router.get("/", async (req, res) => {
  try {
    const reservations = await AccommodationReservation.find(buildTenantFilter(req))
      .sort({ createdAt: -1 })
      .lean();

    const legacyReservations = enrichAccommodationReservations(reservations);

    if (req.query.source === "postgres") {
      const payload = await fetchPrimaryAccommodationData(req.tenantId);
      return res.status(200).json(preferPrimaryCollection(payload.reservations, legacyReservations));
    }

    res.status(200).json(legacyReservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const [reservations, bookings] = await Promise.all([
      AccommodationReservation.find(buildTenantFilter(req)).sort({ createdAt: -1 }).lean(),
      Booking.find(buildTenantFilter(req)).sort({ travelDate: 1, createdAt: -1 }).lean(),
    ]);
    const enrichedReservations = enrichAccommodationReservations(reservations);

    const legacyDashboard = {
      reservations: enrichedReservations,
      board: buildAccommodationDashboard(bookings, enrichedReservations),
      stayTimeline: buildAccommodationStayTimeline(enrichedReservations),
      needsAttention: enrichedReservations.filter(
        (reservation) =>
          reservation.status !== "cancelled" &&
          ((reservation.conflictCount || 0) > 0 ||
            (reservation.status === "confirmed" && !reservation.lastSupplierMessageSharedAt))
      ),
      stats: {
        total: enrichedReservations.length,
        confirmed: enrichedReservations.filter((reservation) => reservation.status === "confirmed").length,
        pending: enrichedReservations.filter((reservation) => reservation.status === "pending").length,
        conflicts: enrichedReservations.filter((reservation) => reservation.conflictCount > 0).length,
      },
    };

    if (req.query.source === "postgres") {
      const primaryDashboard = await fetchPrimaryAccommodationData(req.tenantId);
      return res.status(200).json(preferPrimaryDashboard(primaryDashboard, legacyDashboard, "reservations"));
    }

    res.status(200).json(legacyDashboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = withTenantId(req, {
      bookingId: req.body.bookingId || null,
      hotelId: req.body.hotelId || null,
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
      lastSupplierMessageSharedAt: Object.prototype.hasOwnProperty.call(req.body, "lastSupplierMessageSharedAt")
        ? req.body.lastSupplierMessageSharedAt || null
        : undefined,
      notes: req.body.notes,
    });

    const normalizedPayload = await enrichBookingContext(req, payload);
    await validateReservationPayload(req, normalizedPayload);

    const reservation = await createPostgresFirstAccommodationReservation(
      normalizedPayload,
      process.env
    );

    const reservationView = await findAccommodationReservationRecord(reservation._id, req.tenantId, process.env);
    const responseReservation = reservationView ? buildAccommodationReservationView(reservationView) : reservation.toObject();

    res.status(201).json(enrichAccommodationReservations([responseReservation])[0]);
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
      hotelId: Object.prototype.hasOwnProperty.call(req.body, "hotelId")
        ? req.body.hotelId || null
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
      lastSupplierMessageSharedAt: Object.prototype.hasOwnProperty.call(req.body, "lastSupplierMessageSharedAt")
        ? req.body.lastSupplierMessageSharedAt || null
        : undefined,
      notes: req.body.notes,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    if (updates.bookingId === null) {
      updates.bookingGuestName = "";
      updates.assignedTourTitle = "";
    }

    const currentReservation = await AccommodationReservation.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!currentReservation) {
      return res.status(404).json({ message: "Accommodation reservation not found" });
    }

    const mergedPayload = await enrichBookingContext(req, {
      ...currentReservation,
      ...updates,
    });
    await validateReservationPayload(req, mergedPayload, req.params.id);

    const reservation = await updatePostgresFirstAccommodationReservation(
      req.params.id,
      req.tenantId,
      {
        ...updates,
        bookingGuestName: mergedPayload.bookingGuestName,
        assignedTourTitle: mergedPayload.assignedTourTitle,
        destination: mergedPayload.destination,
        guestCount: mergedPayload.guestCount,
        checkInDate: mergedPayload.checkInDate,
      },
      process.env
    );

    const reservationView = await findAccommodationReservationRecord(reservation._id, req.tenantId, process.env);
    const responseReservation = reservationView ? buildAccommodationReservationView(reservationView) : reservation;

    res.status(200).json(enrichAccommodationReservations([responseReservation])[0]);
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

    await deleteAccommodationReservationRecord(reservation._id, reservation.tenantId);
    await deleteMongoDocumentFromShadowStore({
      entityType: "accommodation-reservations",
      sourceId: reservation._id,
    });

    res.status(200).json({ message: "Accommodation reservation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
