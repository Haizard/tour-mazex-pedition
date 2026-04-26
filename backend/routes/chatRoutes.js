import express from "express";
import { handleChat, listChatConversations, updateChatConversation } from "../controllers/chatController.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.post("/", handleChat);
router.get("/conversations", requireTenantAdmin, listChatConversations);
router.patch("/conversations/:id", requireTenantAdmin, updateChatConversation);

export default router;
