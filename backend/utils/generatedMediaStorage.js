import { Buffer } from "node:buffer";
import Media from "../models/Media.js";
import {
  buildMediaResponsePayload,
  getObjectStorageStrategy,
  uploadStoredMediaAsset,
} from "./objectStorage.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";
import { syncMediaAssetRecord } from "./postgresMediaRecords.js";

export const parseInlineDataUrl = (dataUrl = "") => {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Unsupported generated media format.");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
};

export const syncGeneratedMediaViews = async (media = {}) => {
  await syncMongoDocumentToShadowStore({
    entityType: "media-assets",
    document: media,
    model: Media,
  });

  try {
    await syncMediaAssetRecord(media);
  } catch (error) {
    console.error("Generated media record sync failed:", error.message);
  }
};

export const storeGeneratedMediaAsset = async ({
  tenantId,
  filenameBase = "generated-asset",
  dataUrl,
  strategy = getObjectStorageStrategy(),
  MediaModel = Media,
  syncMediaViews = syncGeneratedMediaViews,
  uploadAsset = uploadStoredMediaAsset,
} = {}) => {
  const { contentType, buffer } = parseInlineDataUrl(dataUrl);
  const extension = contentType.split("/")[1] || "bin";
  const filename = `${String(filenameBase || "generated-asset").replace(/[^a-zA-Z0-9._-]+/g, "-")}.${extension}`;

  const storedAsset = await uploadAsset({
    filename,
    contentType,
    buffer,
    tenantId,
    strategy,
  });

  const media = new MediaModel({
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
  await syncMediaViews(media.toObject ? media.toObject() : media);

  const payload = buildMediaResponsePayload(media);
  return {
    mediaId: payload.mediaId,
    url: payload.url,
    storageProvider: payload.storageProvider,
    contentType: payload.contentType,
    size: payload.size,
  };
};
