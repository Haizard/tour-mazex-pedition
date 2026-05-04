import express from "express";
import process from "node:process";
import PartnerAccount from "../models/PartnerAccount.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { summarizePartnerAccount } from "../utils/partnerPortal.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
  deleteMongoDocumentFromShadowStore,
  syncMongoDocumentToShadowStore,
} from "../utils/postgresShadowWrites.js";
import {
  buildPartnerAccountView,
  deletePartnerAccountRecord,
  findPartnerAccountRecord,
  syncPartnerAccountRecord,
} from "../utils/postgresPartnerRecords.js";
import { fetchPrimaryPartnerAccounts } from "../utils/postgresPrimaryReads.js";
import { preferPrimaryCollection } from "../utils/postgresReadFallback.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("partner-portal"));

const syncPartnerViews = async (partner = {}) => {
  await syncMongoDocumentToShadowStore({
    entityType: "partner-contracts-and-attribution",
    document: partner,
    model: PartnerAccount,
  });

  try {
    await syncPartnerAccountRecord(partner);
  } catch (error) {
    console.error("Partner account record sync failed:", error.message);
  }
};

router.get("/", async (req, res) => {
  try {
    const partners = await PartnerAccount.find(buildTenantFilter(req))
      .sort({ partnerType: 1, companyName: 1 })
      .lean();

    const legacyPartners = partners.map((partner) => ({
      ...partner,
      partnerSummary: summarizePartnerAccount(partner),
    }));

    if (req.query.source === "postgres") {
      const primaryPartners = await fetchPrimaryPartnerAccounts(req.tenantId);
      return res.status(200).json(preferPrimaryCollection(primaryPartners, legacyPartners));
    }

    res.status(200).json(legacyPartners);
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
    await syncPartnerViews(partner.toObject());

    const partnerView = await findPartnerAccountRecord(partner._id, req.tenantId, process.env);

    res.status(201).json({
      ...(partnerView ? buildPartnerAccountView(partnerView) : partner.toObject()),
      partnerSummary: summarizePartnerAccount(partnerView ? buildPartnerAccountView(partnerView) : partner.toObject()),
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
    await syncPartnerViews(partner);

    const partnerView = await findPartnerAccountRecord(partner._id, req.tenantId, process.env);
    const responsePartner = partnerView ? buildPartnerAccountView(partnerView) : partner;

    res.status(200).json({
      ...responsePartner,
      partnerSummary: summarizePartnerAccount(responsePartner),
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

    await deletePartnerAccountRecord(partner._id, partner.tenantId);
    await deleteMongoDocumentFromShadowStore({
      entityType: "partner-contracts-and-attribution",
      sourceId: partner._id,
    });

    res.status(200).json({ message: "Partner account deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id/referral-link", async (req, res) => {
  try {
    const partner = await PartnerAccount.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!partner) {
      return res.status(404).json({ message: "Partner account not found." });
    }

    const { resolveTenantBaseUrl } = await import("../utils/tenantContext.js");
    const baseUrl = resolveTenantBaseUrl(req);
    const referralCode = String(
      partner.referralCode || partner.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    );

    const params = new URLSearchParams({
      source: "partner-referral",
      campaign: `partner-${referralCode}`,
      referral: referralCode,
      utm_source: "partner",
      utm_medium: "referral",
      utm_campaign: referralCode,
    });

    res.status(200).json({
      partnerId: partner._id,
      companyName: partner.companyName,
      referralCode,
      referralUrl: `${baseUrl}/plan-my-trip?${params.toString()}`,
      embedUrl: `${baseUrl}/embed/plan-my-trip?${params.toString()}`,
      apiEndpoint: `${baseUrl}/api/v1/inquiries`,
      attribution: {
        sourceChannel: "partner-referral",
        campaignLabel: `partner-${referralCode}`,
        referralCode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

