import mongoose from "mongoose";
import dotenv from "dotenv";
import { createPostgresFirstQuote, updatePostgresFirstQuote } from "../utils/postgresFirstQuoteService.js";
import QuoteProposal from "../models/QuoteProposal.js";
import { findQuoteRevenueRecord } from "../utils/postgresRevenueRecords.js";
import assert from "node:assert";

dotenv.config();

const testPostgresFirstQuote = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);

  const tenantId = new mongoose.Types.ObjectId();
  const inquiryId = new mongoose.Types.ObjectId();
  
  try {
    console.log("Testing createPostgresFirstQuote...");
    const payload = {
      tenantId,
      inquiryId,
      title: "Safari Dream Quote",
      travelerName: "Quote Truth Traveler",
      status: "draft",
      totalPrice: 4500,
      currency: "USD",
      publicToken: `quote-token-${Date.now()}`,
    };

    const newQuote = await createPostgresFirstQuote(payload);
    
    assert.ok(newQuote._id, "Quote should have an ID");
    assert.strictEqual(newQuote.businessTruth.currentOwner, "postgresql", "Mongo metadata should show PostgreSQL as owner");

    console.log("Verifying in PostgreSQL...");
    const pgRecord = await findQuoteRevenueRecord(newQuote._id, tenantId);
    assert.ok(pgRecord, "PostgreSQL record should exist");
    assert.strictEqual(pgRecord.title, "Safari Dream Quote");
    console.log("✓ Create successfully wrote to both DBs.");

    console.log("Testing updatePostgresFirstQuote...");
    const updatedQuote = await updatePostgresFirstQuote(newQuote._id, tenantId, {
      status: "sent",
      conversionStage: "sent",
      sentAt: new Date(),
    });

    assert.strictEqual(updatedQuote.status, "sent");
    
    const pgUpdated = await findQuoteRevenueRecord(newQuote._id, tenantId);
    assert.strictEqual(pgUpdated.status, "sent");
    console.log("✓ Update successfully wrote to both DBs.");

  } finally {
    console.log("Cleaning up test data...");
    await QuoteProposal.deleteMany({ tenantId });
    await mongoose.disconnect();
  }
};

testPostgresFirstQuote().catch((err) => {
  console.error("PostgreSQL-first quote test failed:", err);
  if (err.message.includes("ECONNREFUSED")) {
    console.log("Skipping full integration check due to network (expected in some environments)");
  } else {
    process.exit(1);
  }
});
