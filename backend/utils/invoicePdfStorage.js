import { generateInvoicePdfBuffer } from "./invoicePdfGenerator.js";
import { uploadStoredMediaAsset } from "./objectStorage.js";
import Media from "../models/Media.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import Booking from "../models/Booking.js";
import { syncMediaAssetRecord } from "./postgresMediaRecords.js";
import { syncPaymentRevenueRecord } from "./postgresRevenueRecords.js";

/**
 * Generates and persists an Invoice PDF for a specific PaymentTransaction.
 * @param {Object} transactionId - The ID of the PaymentTransaction.
 * @param {Object} tenantId - The tenant ID.
 * @param {Object} env - Environment variables.
 * @returns {Promise<Object>} - The updated PaymentTransaction (authoritative or shadow).
 */
export const persistInvoicePdf = async ({ transactionId, tenantId, env = globalThis.process?.env || {} }) => {
  const transaction = await PaymentTransaction.findOne({ _id: transactionId, tenantId }).lean();
  if (!transaction) {
    throw new Error("Payment transaction not found.");
  }

  const booking = transaction.bookingId 
    ? await Booking.findById(transaction.bookingId).lean() 
    : {};

  const pdfBuffer = generateInvoicePdfBuffer(transaction, booking);
  const filename = `Invoice_${String(transaction._id).substring(0, 8).toUpperCase()}.pdf`;
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
    console.error("[PostgresMediaSyncError] Failed to sync Invoice Media record:", pgError.message);
  }

  // 3. PRIMARY: Update PaymentTransaction in PostgreSQL
  const updatedPayload = {
    ...transaction,
    invoiceMediaId: mediaData._id,
    invoiceGeneratedAt: new Date(),
  };

  try {
    await syncPaymentRevenueRecord(updatedPayload, env);
  } catch (pgError) {
    console.error("[PostgresPaymentSyncError] Failed to sync Invoice link to Payment record:", pgError.message);
  }

  // 4. SECONDARY: Shadow to MongoDB (Non-blocking resilience)
  try {
    const mediaRecord = new Media(mediaData);
    await mediaRecord.save();

    const mongoTransaction = await PaymentTransaction.findByIdAndUpdate(
      transactionId,
      {
        $set: {
          invoiceMediaId: mediaRecord._id,
          invoiceGeneratedAt: new Date(),
        },
      },
      { new: true }
    ).populate("invoiceMediaId").lean();

    return mongoTransaction || updatedPayload;
  } catch (mongoError) {
    console.error("[ShadowWriteError] Invoice MongoDB shadow failed:", mongoError.message);
    return updatedPayload;
  }
};
