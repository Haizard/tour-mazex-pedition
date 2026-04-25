import express from "express";
import Booking from "../models/Booking.js";
import GuideDriver from "../models/GuideDriver.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { summarizeGuideDriverAssignment } from "../utils/guideDriverPlanning.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("guide-driver-management"));

router.get("/", async (req, res) => {
  try {
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
      assignmentNotes: req.body.assignmentNotes,
      licenseCategory: req.body.licenseCategory,
    });

    if (payload.assignedBookingId && !payload.assignedTourTitle) {
      const booking = await Booking.findOne(
        buildTenantFilter(req, { _id: payload.assignedBookingId })
      ).lean();
      payload.assignedTourTitle = booking?.packageTour || "";
    }

    const member = new GuideDriver(payload);
    await member.save();

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
      assignmentNotes: req.body.assignmentNotes,
      licenseCategory: req.body.licenseCategory,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    if (updates.assignedBookingId && !updates.assignedTourTitle) {
      const booking = await Booking.findOne(
        buildTenantFilter(req, { _id: updates.assignedBookingId })
      ).lean();
      updates.assignedTourTitle = booking?.packageTour || "";
    }

    if (updates.assignedBookingId === null) {
      updates.assignedTourTitle = "";
      updates.assignmentDate = null;
    }

    const member = await GuideDriver.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true }
    ).lean();

    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }

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

    res.status(200).json({ message: "Team member deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
