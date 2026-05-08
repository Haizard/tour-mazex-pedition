import { Buffer } from "node:buffer";
import process from "node:process";
import express from "express";
import Media from "../models/Media.js";
import {
  assertMediaUploadAllowed,
  buildMediaResponsePayload,
  getObjectStorageStrategy,
  resolveStoredMediaReadPlan,
  uploadStoredMediaAssetWithFallback,
} from "../utils/objectStorage.js";
import { syncMongoDocumentToShadowStore } from "../utils/postgresShadowWrites.js";
import {
  buildMediaAssetView,
  findMediaAssetRecord,
  syncMediaAssetRecord,
} from "../utils/postgresMediaRecords.js";

const router = express.Router();

const syncMediaViews = async (media = {}, env = globalThis.process?.env || {}) => {
  // 1. PRIMARY: Sync to PostgreSQL (Non-blocking but logged)
  try {
    await syncMediaAssetRecord(media, env);
  } catch (error) {
    console.error("[PostgresMediaSyncError] Media asset record sync failed:", error.message);
  }

  // 2. SECONDARY: Sync to MongoDB Shadow Store (Non-blocking)
  try {
    await syncMongoDocumentToShadowStore({
      entityType: "media-assets",
      document: media,
      model: Media,
      env,
    });
  } catch (error) {
    console.error("[ShadowWriteError] Media MongoDB shadow sync failed:", error.message);
  }
};

// POST /api/media/upload
router.post("/upload", async (req, res) => {
  try {
    const { filename, contentType, data, tenantId } = req.body;

    if (!filename || !contentType || !data || !tenantId) {
      return res.status(400).json({ message: "Missing required fields (filename, contentType, data, tenantId)." });
    }

    // Convert Base64 string to Buffer
    const buffer = Buffer.from(data, "base64");

    const strategy = getObjectStorageStrategy();
    assertMediaUploadAllowed({ buffer, strategy });
    const storedAsset = await uploadStoredMediaAssetWithFallback({
      filename,
      contentType,
      buffer,
      tenantId,
      primaryStrategy: strategy,
    });

    const mediaData = {
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
      updatedAt: new Date(),
    };

    // 1. PRIMARY: Write to PostgreSQL
    try {
      await syncMediaAssetRecord(mediaData, process.env);
    } catch (pgError) {
      console.error("[PostgresMediaSyncError] Primary media write failed:", pgError.message);
      // We continue because the asset is already in S3, we want to try Mongo shadow too
    }

    // 2. SECONDARY: Shadow to MongoDB (Non-blocking resilience)
    let responseMedia = mediaData;
    try {
      const media = new Media(mediaData);
      await media.save();
      responseMedia = media.toObject();
    } catch (mongoError) {
      console.error("[ShadowWriteError] Media MongoDB shadow write failed:", mongoError.message);
    }

    const mediaView = await findMediaAssetRecord(mediaData._id || responseMedia._id, tenantId, process.env);
    const finalMedia = mediaView ? buildMediaAssetView(mediaView) : buildMediaResponsePayload(responseMedia);

    res.status(201).json({
      message: "Media uploaded successfully",
      ...finalMedia,
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

    const readPlan = await resolveStoredMediaReadPlan({
      media,
      headers: req.headers,
    });
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
