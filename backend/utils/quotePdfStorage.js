import { generateQuotePdfBuffer } from "./quotePdfGenerator.js";
import { uploadStoredMediaAsset } from "./objectStorage.js";
import Media from "../models/Media.js";
import QuoteProposal from "../models/QuoteProposal.js";

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

  const mediaRecord = new Media({
    tenantId,
    filename,
    contentType,
    size: storageAsset.size,
    storageProvider: storageAsset.storageProvider,
    storageKey: storageAsset.storageKey,
    storageBucket: storageAsset.storageBucket,
    storageEndpoint: storageAsset.storageEndpoint,
    publicUrl: storageAsset.publicUrl,
    data: storageAsset.inlineData, // Only if mongo-inline
  });

  await mediaRecord.save();

  const updatedQuote = await QuoteProposal.findByIdAndUpdate(
    quoteId,
    {
      $set: {
        pdfMediaId: mediaRecord._id,
        pdfGeneratedAt: new Date(),
      },
    },
    { new: true }
  ).populate("pdfMediaId");

  return updatedQuote;
};
