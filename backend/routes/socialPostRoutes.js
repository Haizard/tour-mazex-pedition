import express from "express";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import {
  createSocialPost,
  deleteSocialPost,
  generateSocialPostDraft,
  getSocialPosts,
  updateSocialPost,
} from "../controllers/socialPostController.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.get("/", getSocialPosts);
router.post("/generate", generateSocialPostDraft);
router.post("/", createSocialPost);
router.patch("/:id", updateSocialPost);
router.delete("/:id", deleteSocialPost);

export default router;
