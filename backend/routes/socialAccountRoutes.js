import express from "express";
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

export default router;
