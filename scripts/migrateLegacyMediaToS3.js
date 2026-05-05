import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import Media from "../backend/models/Media.js";
import { uploadStoredMediaAsset, getObjectStorageStrategy } from "../backend/utils/objectStorage.js";
import { syncMediaAssetRecord } from "../backend/utils/postgresMediaRecords.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tour-mazex-pedition";

async function migrateLegacyMedia() {
  console.log("🚀 Starting Legacy Media Migration to S3...");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB.");

    const strategy = getObjectStorageStrategy();
    if (strategy.activeProvider !== "s3-compatible") {
      console.error("❌ S3 storage is not active. Migration aborted.");
      process.exit(1);
    }

    // 1. Migrate Database-indexed Legacy Media (Inline Mongo Data)
    const legacyMedia = await Media.find({
      storageProvider: { $ne: "s3-compatible" },
      data: { $exists: true, $ne: null }
    });

    console.log(`📂 Found ${legacyMedia.length} database media assets to migrate.`);

    for (const media of legacyMedia) {
      try {
        console.log(`📦 Migrating: ${media.filename} (${media._id})`);
        
        const storedAsset = await uploadStoredMediaAsset({
          filename: media.filename,
          contentType: media.contentType,
          buffer: media.data,
          tenantId: String(media.tenantId || "global"),
          strategy
        });

        // Update Mongo
        media.storageProvider = storedAsset.storageProvider;
        media.storageKey = storedAsset.storageKey;
        media.storageBucket = storedAsset.storageBucket;
        media.storageEndpoint = storedAsset.storageEndpoint;
        media.publicUrl = storedAsset.publicUrl;
        media.data = null; // Remove inline binary
        await media.save();

        // Update Postgres
        await syncMediaAssetRecord(media.toObject(), process.env);

        console.log(`✅ Migrated: ${media.filename}`);
      } catch (err) {
        console.error(`❌ Failed to migrate ${media.filename}:`, err.message);
      }
    }

    // 2. Migrate Static Public Assets (Optional - specific files like videos)
    const staticFiles = [
      { path: "public/videos/main.mp4", contentType: "video/mp4", tenantId: "global" },
      { path: "public/videos/footer.mp4", contentType: "video/mp4", tenantId: "global" }
    ];

    console.log("📂 Checking for static assets in public/videos...");

    for (const fileDef of staticFiles) {
      const fullPath = path.resolve(fileDef.path);
      if (fs.existsSync(fullPath)) {
        try {
          console.log(`📦 Migrating Static: ${fileDef.path}`);
          const buffer = fs.readFileSync(fullPath);
          const filename = path.basename(fileDef.path);

          const storedAsset = await uploadStoredMediaAsset({
            filename,
            contentType: fileDef.contentType,
            buffer,
            tenantId: fileDef.tenantId,
            strategy
          });

          // Create a new Media record if it doesn't exist for these static files
          const existing = await Media.findOne({ filename, storageKey: storedAsset.storageKey });
          if (!existing) {
             const newMedia = new Media({
                tenantId: fileDef.tenantId,
                filename,
                contentType: fileDef.contentType,
                size: buffer.length,
                storageProvider: storedAsset.storageProvider,
                storageKey: storedAsset.storageKey,
                storageBucket: storedAsset.storageBucket,
                storageEndpoint: storedAsset.storageEndpoint,
                publicUrl: storedAsset.publicUrl,
                updatedAt: new Date()
             });
             await newMedia.save();
             await syncMediaAssetRecord(newMedia.toObject(), process.env);
             console.log(`✅ Migrated Static & Indexed: ${filename}`);
          } else {
             console.log(`ℹ️ Static file ${filename} already indexed in S3.`);
          }
        } catch (err) {
          console.error(`❌ Failed to migrate static ${fileDef.path}:`, err.message);
        }
      }
    }

    console.log("🏁 Migration Completed.");
  } catch (error) {
    console.error("💥 Migration Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateLegacyMedia();
