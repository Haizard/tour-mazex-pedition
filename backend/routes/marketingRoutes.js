import express from "express";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
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
router.post("/repurpose-blog", generateRepurposedContent);
router.get("/campaigns", getCampaigns);
router.post("/campaigns/generate", generateCampaignDraft);
router.post("/campaigns", createCampaign);
router.patch("/campaigns/:id", updateCampaign);
router.delete("/campaigns/:id", deleteCampaign);

export default router;
