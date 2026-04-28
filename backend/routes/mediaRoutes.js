import { Buffer } from "node:buffer";
import express from "express";
import Media from "../models/Media.js";
import {
  buildMediaResponsePayload,
  buildStoredMediaReadPlan,
  getObjectStorageStrategy,
  persistMediaAsset,
} from "../utils/objectStorage.js";

const router = express.Router();

// POST /api/media/upload
router.post("/upload", async (req, res) => {
  try {
    const { filename, contentType, data, tenantId } = req.body;

    if (!filename || !contentType || !data || !tenantId) {
      return res.status(400).json({ message: "Missing required fields (filename, contentType, data, tenantId)." });
    }

    // Convert Base64 string to Buffer
    const buffer = Buffer.from(data, "base64");

    // Check size (MongoDB limit is 16MB)
    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({ message: "File is too large. Max size for direct DB storage is 15MB." });
    }

    const strategy = getObjectStorageStrategy();
    const storedAsset = persistMediaAsset({
      filename,
      contentType,
      buffer,
      tenantId,
      strategy,
    });

    const media = new Media({
      tenantId,
      filename,
      contentType,
      data: storedAsset.inlineData,
      size: storedAsset.size,
      storageProvider: storedAsset.storageProvider,
      storageKey: storedAsset.storageKey,
      storageBucket: storedAsset.storageBucket,
      storageEndpoint: storedAsset.storageEndpoint,
      publicUrl: storedAsset.publicUrl,
    });

    await media.save();

    res.status(201).json({
      message: "Media uploaded successfully",
      ...buildMediaResponsePayload(media),
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/media/:id
router.get("/:id", async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    const readPlan = buildStoredMediaReadPlan(media, req.headers);
    const cacheControl = getObjectStorageStrategy().cacheControl;

    if (readPlan.mode === "redirect") {
      res.redirect(302, readPlan.redirectUrl);
      return;
    }

    if (readPlan.mode === "invalid-range") {
      res.status(416).set("Content-Range", `bytes */${readPlan.totalSize}`).send();
      return;
    }

    if (readPlan.mode === "inline-range") {
      const chunk = media.data.subarray(readPlan.start, readPlan.end + 1);
      const contentLength = readPlan.end - readPlan.start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${readPlan.start}-${readPlan.end}/${readPlan.totalSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": media.contentType,
        "Cache-Control": cacheControl,
      });

      res.end(chunk);
      return;
    }

    res.writeHead(200, {
      "Content-Length": readPlan.totalSize,
      "Content-Type": media.contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": cacheControl,
    });
    res.end(media.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
