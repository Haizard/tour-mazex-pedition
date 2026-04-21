import express from "express";
import Media from "../models/Media.js";

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

    const media = new Media({
      tenantId,
      filename,
      contentType,
      data: buffer,
      size: buffer.length,
    });

    await media.save();

    res.status(201).json({
      message: "Media uploaded successfully",
      mediaId: media._id,
      url: `/api/media/${media._id}`,
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

    res.set("Content-Type", media.contentType);
    res.set("Content-Length", media.size);
    res.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

    res.send(media.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
