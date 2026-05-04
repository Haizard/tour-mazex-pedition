import { generateItineraryPdfBuffer } from "./itineraryPdfGenerator.js";
import { uploadStoredMediaAsset } from "./objectStorage.js";
import Media from "../models/Media.js";
import Booking from "../models/Booking.js";
import QuoteProposal from "../models/QuoteProposal.js";
import { syncMediaAssetRecord } from "./postgresMediaRecords.js";
import { syncBookingRevenueRecord } from "./postgresRevenueRecords.js";

/**
 * Generates and persists an Itinerary PDF for a specific Booking.
 * @param {Object} bookingId - The ID of the Booking.
 * @param {Object} tenantId - The tenant ID.
 * @param {Object} env - Environment variables.
 * @returns {Promise<Object>} - The updated Booking (authoritative or shadow).
 */
export const persistItineraryPdf = async ({ bookingId, tenantId, env = globalThis.process?.env || {} }) => {
  const booking = await Booking.findOne({ _id: bookingId, tenantId }).lean();
  if (!booking) {
    throw new Error("Booking not found.");
  }

  const quote = booking.quoteProposalId 
    ? await QuoteProposal.findById(booking.quoteProposalId).lean() 
    : {};

  const pdfBuffer = generateItineraryPdfBuffer(booking, quote);
  const filename = `Itinerary_${String(booking._id).substring(0, 8).toUpperCase()}.pdf`;
  const contentType = "application/pdf";

  // 1. Upload to Object Storage
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

  // 2. PRIMARY: Sync Media Record to PostgreSQL
  try {
    await syncMediaAssetRecord(mediaData, env);
  } catch (pgError) {
    console.error("[PostgresMediaSyncError] Failed to sync Itinerary Media record:", pgError.message);
  }

  // 3. PRIMARY: Update Booking in PostgreSQL
  const updatedPayload = {
    ...booking,
    itineraryMediaId: mediaData._id,
    itineraryGeneratedAt: new Date(),
  };

  try {
    await syncBookingRevenueRecord(updatedPayload, env);
  } catch (pgError) {
    console.error("[PostgresBookingSyncError] Failed to sync Itinerary link to Booking record:", pgError.message);
  }

  // 4. SECONDARY: Shadow to MongoDB (Non-blocking resilience)
  try {
    const mediaRecord = new Media(mediaData);
    await mediaRecord.save();

    const mongoBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          itineraryMediaId: mediaRecord._id,
          itineraryGeneratedAt: new Date(),
        },
      },
      { new: true }
    ).populate("itineraryMediaId").lean();

    return mongoBooking || updatedPayload;
  } catch (mongoError) {
    console.error("[ShadowWriteError] Itinerary MongoDB shadow failed:", mongoError.message);
    return updatedPayload;
  }
};
