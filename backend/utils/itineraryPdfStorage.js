import { generateItineraryPdfBuffer } from "./itineraryPdfGenerator.js";
import { uploadStoredMediaAsset } from "./objectStorage.js";
import Media from "../models/Media.js";
import Booking from "../models/Booking.js";
import QuoteProposal from "../models/QuoteProposal.js";

/**
 * Generates and persists an Itinerary PDF for a specific Booking.
 * @param {Object} bookingId - The ID of the Booking.
 * @param {Object} tenantId - The tenant ID.
 * @param {Object} env - Environment variables.
 * @returns {Promise<Object>} - The updated Booking.
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
    data: storageAsset.inlineData,
  });

  await mediaRecord.save();

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    {
      $set: {
        itineraryMediaId: mediaRecord._id,
        itineraryGeneratedAt: new Date(),
      },
    },
    { new: true }
  ).populate("itineraryMediaId");

  return updatedBooking;
};
