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

    const totalSize = media.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.status(416).set("Content-Range", `bytes */${totalSize}`).send();
        return;
      }

      const chunk = media.data.subarray(start, end + 1);
      const contentLength = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": media.contentType,
        "Cache-Control": "public, max-age=31536000",
      });

      res.end(chunk);
    } else {
      res.writeHead(200, {
        "Content-Length": totalSize,
        "Content-Type": media.contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000",
      });
      res.end(media.data);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
