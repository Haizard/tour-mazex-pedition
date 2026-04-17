import express from "express";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import {
  getMenuItems,
  createMenuItem,
  deleteMenuItem,
  resetMenuItems,
  updateMenuItem,
} from "../controllers/menuController.js";

const router = express.Router();

router.get("/", getMenuItems);
router.post("/", requireTenantAdmin, createMenuItem);
router.put("/:id", requireTenantAdmin, updateMenuItem);
router.post("/reset-defaults", requireTenantAdmin, resetMenuItems);
router.delete("/:id", requireTenantAdmin, deleteMenuItem);

export default router;
