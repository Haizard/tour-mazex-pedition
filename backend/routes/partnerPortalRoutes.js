import express from "express";
import PartnerAccount from "../models/PartnerAccount.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { summarizePartnerAccount } from "../utils/partnerPortal.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("partner-portal"));

router.get("/", async (req, res) => {
  try {
    const partners = await PartnerAccount.find(buildTenantFilter(req))
      .sort({ partnerType: 1, companyName: 1 })
      .lean();

    res.status(200).json(
      partners.map((partner) => ({
        ...partner,
        partnerSummary: summarizePartnerAccount(partner),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const partner = new PartnerAccount(
      withTenantId(req, {
        partnerType: req.body.partnerType,
        companyName: req.body.companyName,
        contactName: req.body.contactName,
        email: req.body.email,
        phone: req.body.phone,
        location: req.body.location,
        serviceFocus: req.body.serviceFocus,
        contractLabel: req.body.contractLabel,
        payoutTerms: req.body.payoutTerms,
        notes: req.body.notes,
        status: req.body.status,
      })
    );

    await partner.save();

    res.status(201).json({
      ...partner.toObject(),
      partnerSummary: summarizePartnerAccount(partner.toObject()),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updates = {
      partnerType: req.body.partnerType,
      companyName: req.body.companyName,
      contactName: req.body.contactName,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,
      serviceFocus: req.body.serviceFocus,
      contractLabel: req.body.contractLabel,
      payoutTerms: req.body.payoutTerms,
      notes: req.body.notes,
      status: req.body.status,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const partner = await PartnerAccount.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true }
    ).lean();

    if (!partner) {
      return res.status(404).json({ message: "Partner account not found" });
    }

    res.status(200).json({
      ...partner,
      partnerSummary: summarizePartnerAccount(partner),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const partner = await PartnerAccount.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!partner) {
      return res.status(404).json({ message: "Partner account not found" });
    }

    res.status(200).json({ message: "Partner account deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
