import { generateInvoicePdfBuffer } from "./invoicePdfGenerator.js";
import { uploadStoredMediaAsset } from "./objectStorage.js";
import Media from "../models/Media.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import Booking from "../models/Booking.js";

/**
 * Generates and persists an Invoice PDF for a specific PaymentTransaction.
 * @param {Object} transactionId - The ID of the PaymentTransaction.
 * @param {Object} tenantId - The tenant ID.
 * @param {Object} env - Environment variables.
 * @returns {Promise<Object>} - The updated PaymentTransaction.
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

  const updatedTransaction = await PaymentTransaction.findByIdAndUpdate(
    transactionId,
    {
      $set: {
        invoiceMediaId: mediaRecord._id,
        invoiceGeneratedAt: new Date(),
      },
    },
    { new: true }
  ).populate("invoiceMediaId");

  return updatedTransaction;
};
