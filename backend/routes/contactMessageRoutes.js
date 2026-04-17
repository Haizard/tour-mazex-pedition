import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const router = express.Router();

router.get("/", requireTenantAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find(buildTenantFilter(req)).sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const message = new ContactMessage(withTenantId(req, req.body));
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", requireTenantAdmin, async (req, res) => {
  try {
    const updated = await ContactMessage.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { status: req.body.status },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", requireTenantAdmin, async (req, res) => {
  try {
    await ContactMessage.findOneAndDelete(buildTenantFilter(req, { _id: req.params.id }));
    res.status(200).json({ message: "Contact message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
