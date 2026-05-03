import express from "express";
import WhatsAppTemplate from "../models/WhatsAppTemplate.js";
import { buildTenantFilter } from "../utils/tenantContext.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import {
  createSocialAccount,
  deleteSocialAccount,
  getSocialAccounts,
  publishSocialPostLive,
  sendInquiryWhatsAppMessage,
  updateSocialAccount,
  verifySocialAccount,
} from "../controllers/socialAccountController.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.get("/", requireSubscriptionFeature("social-accounts"), getSocialAccounts);
router.post("/", requireSubscriptionFeature("social-accounts"), createSocialAccount);
router.patch("/:id", requireSubscriptionFeature("social-accounts"), updateSocialAccount);
router.delete("/:id", requireSubscriptionFeature("social-accounts"), deleteSocialAccount);
router.post("/:id/verify", requireSubscriptionFeature("social-accounts"), verifySocialAccount);
router.post(
  "/social-posts/:id/publish",
  requireSubscriptionFeature("social-posts"),
  publishSocialPostLive
);
router.post(
  "/inquiries/:id/send-whatsapp",
  requireSubscriptionFeature("whatsapp-automation"),
  sendInquiryWhatsAppMessage
);

// Get WhatsApp templates
router.get("/whatsapp/templates", async (req, res) => {
  try {
    const templates = await WhatsAppTemplate.find(
      buildTenantFilter(req, { status: "APPROVED" })
    ).lean();
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
