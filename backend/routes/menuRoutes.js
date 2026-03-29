import express from "express";
import {
  getMenuItems,
  createMenuItem,
  deleteMenuItem,
  resetMenuItems,
} from "../controllers/menuController.js";

const router = express.Router();

router.get("/", getMenuItems);
router.post("/", createMenuItem);
router.post("/reset-defaults", resetMenuItems);
router.delete("/:id", deleteMenuItem);

export default router;
