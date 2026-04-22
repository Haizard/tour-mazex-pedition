import express from "express";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import {
  createCampaign,
  deleteCampaign,
  generateCampaignDraft,
  generateRepurposedContent,
  getCampaigns,
  updateCampaign,
} from "../controllers/marketingController.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.post(
  "/repurpose-blog",
  requireSubscriptionFeature("repurposing"),
  generateRepurposedContent
);
router.get("/campaigns", requireSubscriptionFeature("campaigns"), getCampaigns);
router.post(
  "/campaigns/generate",
  requireSubscriptionFeature("campaigns"),
  generateCampaignDraft
);
router.post("/campaigns", requireSubscriptionFeature("campaigns"), createCampaign);
router.patch("/campaigns/:id", requireSubscriptionFeature("campaigns"), updateCampaign);
router.delete("/campaigns/:id", requireSubscriptionFeature("campaigns"), deleteCampaign);

export default router;
