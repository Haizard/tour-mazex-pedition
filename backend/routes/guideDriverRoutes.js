import express from "express";
import Booking from "../models/Booking.js";
import GuideDriver from "../models/GuideDriver.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import {
  buildGuideDriverCalendarView,
  buildGuideDriverDispatchBoard,
  summarizeGuideDriverAssignment,
} from "../utils/guideDriverPlanning.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
  deleteMongoDocumentFromShadowStore,
  syncMongoDocumentToShadowStore,
} from "../utils/postgresShadowWrites.js";
import {
  deleteGuideDriverAssignmentRecord,
  syncGuideDriverAssignmentRecord,
} from "../utils/postgresOperationsRecords.js";
import { fetchPrimaryGuideDriverData } from "../utils/postgresPrimaryReads.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("guide-driver-management"));

const syncGuideDriverViews = async (member = {}) => {
  await syncMongoDocumentToShadowStore({
    entityType: "guide-driver-assignments",
    document: member,
    model: GuideDriver,
  });

  try {
    await syncGuideDriverAssignmentRecord(member);
  } catch (error) {
    console.error("Guide-driver record sync failed:", error.message);
  }
};

const enrichAssignmentWindow = async (req, payload = {}) => {
  const nextPayload = { ...payload };

  if (nextPayload.assignedBookingId) {
    const booking = await Booking.findOne(
      buildTenantFilter(req, { _id: nextPayload.assignedBookingId })
    ).lean();

    if (!booking) {
      throw new Error("Assigned booking was not found.");
    }

    nextPayload.assignedTourTitle = booking.packageTour || "";
    nextPayload.assignmentStartDate =
      nextPayload.assignmentStartDate || nextPayload.assignmentDate || booking.travelDate || null;
    nextPayload.assignmentEndDate =
      nextPayload.assignmentEndDate || nextPayload.assignmentStartDate || booking.travelDate || null;
  }

  return nextPayload;
};

const validateAssignmentPayload = async (req, payload = {}, currentMemberId = null) => {
  if (payload.availabilityStatus === "off-duty" && payload.assignedBookingId) {
    throw new Error("Off-duty staff cannot be assigned to a booking.");
  }

  if (payload.availabilityStatus === "assigned" && !payload.assignedBookingId) {
    throw new Error("Assigned staff must be linked to a booking.");
  }

  if (payload.assignmentStartDate && payload.assignmentEndDate) {
    const startDate = new Date(payload.assignmentStartDate);
    const endDate = new Date(payload.assignmentEndDate);
    if (startDate > endDate) {
      throw new Error("Assignment end date cannot be earlier than the start date.");
    }
  }

  if (payload.assignedBookingId) {
    const duplicateCoverage = await GuideDriver.findOne(
      buildTenantFilter(req, {
        _id: { $ne: currentMemberId || null },
        assignedBookingId: payload.assignedBookingId,
        staffType: payload.staffType,
        availabilityStatus: "assigned",
      })
    ).lean();

    if (duplicateCoverage) {
      const staffLabel = payload.staffType === "driver" ? "driver" : "guide";
      throw new Error(
        `Dispatch conflict: ${duplicateCoverage.fullName} is already assigned as the ${staffLabel} for this booking.`
      );
    }
  }
};

router.get("/", async (req, res) => {
  try {
    if (req.query.source === "postgres") {
      const payload = await fetchPrimaryGuideDriverData(req.tenantId);
      return res.status(200).json(payload.team);
    }

    const team = await GuideDriver.find(buildTenantFilter(req))
      .sort({ staffType: 1, fullName: 1 })
      .lean();

    res.status(200).json(
      team.map((member) => ({
        ...member,
        assignmentSummary: summarizeGuideDriverAssignment(member),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    if (req.query.source === "postgres") {
      return res.status(200).json(await fetchPrimaryGuideDriverData(req.tenantId));
    }

    const [team, bookings] = await Promise.all([
      GuideDriver.find(buildTenantFilter(req))
        .sort({ staffType: 1, fullName: 1 })
        .lean(),
      Booking.find(buildTenantFilter(req))
        .sort({ travelDate: 1, createdAt: -1 })
        .lean(),
    ]);

    const roster = team.map((member) => ({
      ...member,
      assignmentSummary: summarizeGuideDriverAssignment(member),
      notificationReady: Boolean(member.availabilityStatus === "assigned" && member.assignedBookingId),
    }));

    res.status(200).json({
      team: roster,
      dispatchBoard: buildGuideDriverDispatchBoard(bookings, roster),
      calendarView: buildGuideDriverCalendarView(roster),
      needsAttention: roster.filter(
        (member) => member.availabilityStatus === "assigned" && !member.lastDispatchSharedAt
      ),
      stats: {
        total: roster.length,
        available: roster.filter((member) => member.availabilityStatus === "available").length,
        assigned: roster.filter((member) => member.availabilityStatus === "assigned").length,
        offDuty: roster.filter((member) => member.availabilityStatus === "off-duty").length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = withTenantId(req, {
      staffType: req.body.staffType,
      fullName: req.body.fullName,
      phone: req.body.phone,
      email: req.body.email,
      homeBase: req.body.homeBase,
      availabilityStatus: req.body.availabilityStatus,
      languages: Array.isArray(req.body.languages) ? req.body.languages : [],
      specialties: Array.isArray(req.body.specialties) ? req.body.specialties : [],
      assignedBookingId: req.body.assignedBookingId || null,
      assignedTourTitle: req.body.assignedTourTitle,
      assignmentDate: req.body.assignmentDate || null,
      assignmentStartDate: req.body.assignmentStartDate || null,
      assignmentEndDate: req.body.assignmentEndDate || null,
      assignmentNotes: req.body.assignmentNotes,
      licenseCategory: req.body.licenseCategory,
      lastDispatchSharedAt: Object.prototype.hasOwnProperty.call(req.body, "lastDispatchSharedAt")
        ? req.body.lastDispatchSharedAt || null
        : undefined,
    });

    const normalizedPayload = await enrichAssignmentWindow(req, payload);
    await validateAssignmentPayload(req, normalizedPayload);

    const member = new GuideDriver(normalizedPayload);
    await member.save();
    await syncGuideDriverViews(member.toObject());

    res.status(201).json({
      ...member.toObject(),
      assignmentSummary: summarizeGuideDriverAssignment(member.toObject()),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updates = {
      staffType: req.body.staffType,
      fullName: req.body.fullName,
      phone: req.body.phone,
      email: req.body.email,
      homeBase: req.body.homeBase,
      availabilityStatus: req.body.availabilityStatus,
      languages: Array.isArray(req.body.languages) ? req.body.languages : undefined,
      specialties: Array.isArray(req.body.specialties) ? req.body.specialties : undefined,
      assignedBookingId: Object.prototype.hasOwnProperty.call(req.body, "assignedBookingId")
        ? req.body.assignedBookingId || null
        : undefined,
      assignedTourTitle: req.body.assignedTourTitle,
      assignmentDate: Object.prototype.hasOwnProperty.call(req.body, "assignmentDate")
        ? req.body.assignmentDate || null
        : undefined,
      assignmentStartDate: Object.prototype.hasOwnProperty.call(req.body, "assignmentStartDate")
        ? req.body.assignmentStartDate || null
        : undefined,
      assignmentEndDate: Object.prototype.hasOwnProperty.call(req.body, "assignmentEndDate")
        ? req.body.assignmentEndDate || null
        : undefined,
      assignmentNotes: req.body.assignmentNotes,
      licenseCategory: req.body.licenseCategory,
      lastDispatchSharedAt: Object.prototype.hasOwnProperty.call(req.body, "lastDispatchSharedAt")
        ? req.body.lastDispatchSharedAt || null
        : undefined,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    if (updates.assignedBookingId === null) {
      updates.assignedTourTitle = "";
      updates.assignmentDate = null;
      updates.assignmentStartDate = null;
      updates.assignmentEndDate = null;
    }

    const currentMember = await GuideDriver.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!currentMember) {
      return res.status(404).json({ message: "Team member not found" });
    }

    const mergedUpdates = await enrichAssignmentWindow(req, {
      ...currentMember,
      ...updates,
    });
    await validateAssignmentPayload(req, mergedUpdates, req.params.id);

    const nextUpdateState =
      updates.assignmentStartDate === undefined && updates.assignmentEndDate === undefined
        ? {
            ...updates,
            assignedTourTitle: mergedUpdates.assignedTourTitle,
            assignmentStartDate: mergedUpdates.assignmentStartDate,
            assignmentEndDate: mergedUpdates.assignmentEndDate,
          }
        : {
            ...updates,
            assignedTourTitle: mergedUpdates.assignedTourTitle,
          };

    const member = await GuideDriver.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: nextUpdateState },
      { new: true }
    ).lean();
    await syncGuideDriverViews(member);

    res.status(200).json({
      ...member,
      assignmentSummary: summarizeGuideDriverAssignment(member),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const member = await GuideDriver.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    );

    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }

    await deleteGuideDriverAssignmentRecord(member._id, member.tenantId);
    await deleteMongoDocumentFromShadowStore({
      entityType: "guide-driver-assignments",
      sourceId: member._id,
    });

    res.status(200).json({ message: "Team member deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
