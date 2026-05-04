import mongoose from "mongoose";
import dotenv from "dotenv";
import { persistInvoicePdf } from "../utils/invoicePdfStorage.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import Media from "../models/Media.js";
import { findMediaAssetRecord } from "../utils/postgresMediaRecords.js";
import { findPaymentRevenueRecord } from "../utils/postgresRevenueRecords.js";

dotenv.config();

const testArtifactHardening = async () => {
  console.log("Starting Artifact Hardening Verification...");
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const tenantId = "test-tenant-123";

    // 1. Setup Mock Transaction
    const mockTransaction = new PaymentTransaction({
      tenantId,
      amount: 1500,
      status: "paid",
      customerName: "Artifact Tester",
      provider: "stripe",
    });
    await mockTransaction.save();
    console.log(`Created mock transaction: ${mockTransaction._id}`);

    // 2. Trigger Persist PDF (which now uses the hardened PG-first logic)
    console.log("Persisting Invoice PDF...");
    const updatedTransaction = await persistInvoicePdf({
      transactionId: mockTransaction._id,
      tenantId,
      env: process.env,
    });

    const mediaId = updatedTransaction.invoiceMediaId?._id || updatedTransaction.invoiceMediaId;
    console.log(`PDF Persisted. Media ID: ${mediaId}`);

    // 3. Verify PostgreSQL Truth for Media
    console.log("Verifying Media in PostgreSQL...");
    const pgMedia = await findMediaAssetRecord(mediaId, tenantId, process.env);
    if (pgMedia) {
      console.log("✅ Media record found in PostgreSQL.");
    } else {
      console.warn("❌ Media record NOT found in PostgreSQL (check network/config).");
    }

    // 4. Verify PostgreSQL Truth for Transaction Linkage
    console.log("Verifying Transaction linkage in PostgreSQL...");
    const pgTransaction = await findPaymentRevenueRecord(mockTransaction._id, tenantId, process.env);
    if (pgTransaction && pgTransaction.source_payload?.invoiceMediaId) {
      console.log("✅ Transaction link found in PostgreSQL source_payload.");
    } else {
      console.warn("❌ Transaction link NOT found in PostgreSQL (check sync logic).");
    }

    // Cleanup
    await PaymentTransaction.deleteOne({ _id: mockTransaction._id });
    if (mediaId) await Media.deleteOne({ _id: mediaId });
    
  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

testArtifactHardening();
