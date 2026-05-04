import express from "express";
import crypto from "node:crypto";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { buildTenantFilter } from "../utils/tenantContext.js";
import ApiKey from "../models/ApiKey.js";

const router = express.Router();
router.use(requireTenantAdmin);

// List all API keys for this tenant
router.get("/", async (req, res) => {
  try {
    const keys = await ApiKey.find(buildTenantFilter(req))
      .select("-keyHash")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(keys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate a new API key
router.post("/", async (req, res) => {
  try {
    const { label = "Default Key", scopes, expiresInDays } = req.body;

    const { raw, keyHash, keyPrefix } = ApiKey.generateKey();

    const expiresAt = expiresInDays
      ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = new ApiKey({
      tenantId: req.tenantId,
      keyHash,
      keyPrefix,
      label,
      scopes: Array.isArray(scopes) ? scopes : ["tours:read", "inquiries:write"],
      expiresAt,
    });

    await apiKey.save();

    // Return the raw key ONCE — it cannot be retrieved again
    res.status(201).json({
      id: apiKey._id,
      label: apiKey.label,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      // Raw key — show once, store nowhere
      apiKey: raw,
      warning: "Save this API key now. It will not be shown again.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Revoke an API key
router.delete("/:id", async (req, res) => {
  try {
    const key = await ApiKey.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { active: false },
      { new: true }
    ).lean();

    if (!key) return res.status(404).json({ message: "API key not found." });

    res.status(200).json({ message: "API key revoked successfully.", id: key._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
