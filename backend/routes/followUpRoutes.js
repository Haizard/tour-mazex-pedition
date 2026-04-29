import express from "express";
import LeadFollowUpSequence from "../models/LeadFollowUpSequence.js";
import CustomInquiry from "../models/CustomInquiry.js";
import Tenant from "../models/Tenant.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import { generateFollowUpSequence } from "../utils/followUpSequencing.js";
import { fetchPrimaryLeadFollowUpSequence } from "../utils/postgresPrimaryReads.js";
import { syncLeadFollowUpSequenceRecord } from "../utils/postgresEngagementRecords.js";

const router = express.Router();

router.use(requireTenantAdmin);

// Start a sequence for an inquiry
router.post("/start/:inquiryId", async (req, res) => {
  try {
    const inquiry = await CustomInquiry.findOne(
      buildTenantFilter(req, { _id: req.params.inquiryId })
    ).lean();

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    // Check if a sequence already exists
    const existing = await LeadFollowUpSequence.findOne(
      buildTenantFilter(req, { inquiryId: inquiry._id, status: "active" })
    );

    if (existing) {
      return res.status(400).json({ message: "An active follow-up sequence already exists for this lead." });
    }

    const tenant = await Tenant.findById(req.tenantId).lean();
    const touchpoints = generateFollowUpSequence(inquiry, { 
      tenantName: tenant?.brandName || tenant?.name || "our team" 
    });
    
    const sequence = new LeadFollowUpSequence(
      withTenantId(req, {
        inquiryId: inquiry._id,
        status: "active",
        touchpoints,
      })
    );

    await sequence.save();
    await syncLeadFollowUpSequenceRecord(sequence.toObject());

    res.status(201).json(sequence);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active sequence for an inquiry
router.get("/inquiry/:inquiryId", async (req, res) => {
  try {
    if (String(req.query.source || "").toLowerCase() === "postgres") {
      return res.status(200).json(
        await fetchPrimaryLeadFollowUpSequence(req.params.inquiryId, String(req.tenantId || ""))
      );
    }

    const sequence = await LeadFollowUpSequence.findOne(
      buildTenantFilter(req, { inquiryId: req.params.inquiryId })
    ).sort({ createdAt: -1 }).lean();

    res.status(200).json(sequence || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update sequence status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "paused", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const sequence = await LeadFollowUpSequence.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: { status } },
      { new: true }
    ).lean();

    if (!sequence) {
      return res.status(404).json({ message: "Sequence not found." });
    }

    await syncLeadFollowUpSequenceRecord(sequence);
    res.status(200).json(sequence);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
