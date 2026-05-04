import { generateQuotePdfBuffer } from "./quotePdfGenerator.js";
import { uploadStoredMediaAsset } from "./objectStorage.js";
import Media from "../models/Media.js";
import QuoteProposal from "../models/QuoteProposal.js";
import { syncMediaAssetRecord } from "./postgresMediaRecords.js";
import { syncQuoteRevenueRecord } from "./postgresRevenueRecords.js";

/**
 * Generates and persists a PDF for a specific QuoteProposal.
 * @param {Object} quoteId - The ID of the QuoteProposal.
 * @param {Object} tenantId - The tenant ID.
 * @param {Object} env - Environment variables.
 * @returns {Promise<Object>} - The updated QuoteProposal.
 */
export const persistQuotePdf = async ({ quoteId, tenantId, env = globalThis.process?.env || {} }) => {
  const quote = await QuoteProposal.findOne({ _id: quoteId, tenantId }).lean();
  if (!quote) {
    throw new Error("Quote not found.");
  }

  const pdfBuffer = generateQuotePdfBuffer(quote);
  const filename = `${quote.title.replace(/\s+/g, "_")}_Quote.pdf`;
  const contentType = "application/pdf";

  const storageAsset = await uploadStoredMediaAsset({
    filename,
    contentType,
    buffer: pdfBuffer,
    tenantId,
    env,
  });

  const mediaData = {
    tenantId,
    filename,
    contentType,
    size: storageAsset.size,
    storageProvider: storageAsset.storageProvider,
    storageKey: storageAsset.storageKey,
    storageBucket: storageAsset.storageBucket,
    storageEndpoint: storageAsset.storageEndpoint,
    publicUrl: storageAsset.publicUrl,
    data: storageAsset.inlineData,
  };

  // PRIMARY: Sync Media Record to PostgreSQL
  try {
    await syncMediaAssetRecord(mediaData, env);
  } catch (pgError) {
    console.error("[PostgresMediaSyncError] Failed to sync Quote Media record:", pgError.message);
  }

  // PRIMARY: Update Quote in PostgreSQL
  const updatedPayload = {
    ...quote,
    pdfMediaId: mediaData._id,
    pdfGeneratedAt: new Date(),
  };

  try {
    await syncQuoteRevenueRecord(updatedPayload, env);
  } catch (pgError) {
    console.error("[PostgresQuoteSyncError] Failed to sync PDF link to Quote record:", pgError.message);
  }

  // SECONDARY: Shadow to MongoDB
  try {
    const mediaRecord = new Media(mediaData);
    await mediaRecord.save();

    const mongoQuote = await QuoteProposal.findByIdAndUpdate(
      quoteId,
      {
        $set: {
          pdfMediaId: mediaRecord._id,
          pdfGeneratedAt: new Date(),
        },
      },
      { new: true }
    ).populate("pdfMediaId").lean();

    return mongoQuote || updatedPayload;
  } catch (mongoError) {
    console.error("[ShadowWriteError] Quote MongoDB shadow failed:", mongoError.message);
    return updatedPayload;
  }
};
